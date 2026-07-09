/**
 * Drift-prevention hook subcommands (SPEC-DRIFT-PREVENTION-HOOKS §2–§5).
 *
 *   thoughtbox hook capture-user-turn    UserPromptSubmit, async
 *   thoughtbox hook surface-decisions    UserPromptSubmit, sync
 *   thoughtbox hook promote-to-decision  UserPromptSubmit, async
 *   thoughtbox hook audit-response       Stop, sync, local-only
 *
 * All hooks fail open (exit 0) on missing config, unreachable server, or
 * malformed payloads. Only surface-decisions and audit-response ever write
 * to stdout — for UserPromptSubmit hooks stdout becomes model context, so
 * the async hooks stay silent.
 */
import { readFile } from 'node:fs/promises';
import { authHeaders, hookTimeoutMs, isSyncDelivery, parseRegexListEnv, readHookPayload, resolveHookConnection, spawnDetachedSelf, } from './hook-common.js';
const DEFAULT_REMINDER_LIMIT = 10;
const MAX_REMINDER_LIMIT = 25;
const MAX_DECISION_CHARS = 600;
// ---------------------------------------------------------------------------
// capture-user-turn (spec §2)
// ---------------------------------------------------------------------------
export async function runCaptureUserTurn(args, runtime) {
    const payload = await readHookPayload(args, runtime);
    const sessionId = stringField(payload, 'session_id');
    const prompt = stringField(payload, 'prompt');
    if (!sessionId || !prompt)
        return 0;
    if (!isSyncDelivery(args, runtime.env)) {
        try {
            await spawnDetachedSelf('capture-user-turn', { session_id: sessionId, prompt }, runtime.env);
        }
        catch (error) {
            runtime.writeStderr(`thoughtbox capture-user-turn: detach failed (${describe(error)}); turn not captured`);
        }
        return 0;
    }
    const connection = await resolveHookConnection(runtime);
    if (!connection) {
        runtime.writeStderr('thoughtbox capture-user-turn: no Thoughtbox endpoint configured; turn not captured');
        return 0;
    }
    try {
        await runtime.fetchImpl(`${connection.baseUrl}/drift/session-thought`, {
            method: 'POST',
            headers: authHeaders(connection),
            body: JSON.stringify({
                claudeSessionId: sessionId,
                thoughtType: 'context_snapshot',
                content: prompt,
                tags: ['user-turn', sessionId],
            }),
            signal: AbortSignal.timeout(hookTimeoutMs(runtime.env)),
        });
    }
    catch (error) {
        runtime.writeStderr(`thoughtbox capture-user-turn: delivery failed (${describe(error)}); turn not captured`);
    }
    return 0;
}
export async function runSurfaceDecisions(args, runtime) {
    const payload = await readHookPayload(args, runtime);
    const sessionId = stringField(payload, 'session_id');
    if (!sessionId)
        return 0;
    const connection = await resolveHookConnection(runtime);
    if (!connection)
        return 0;
    const limit = reminderLimit(runtime.env);
    let decisions;
    try {
        const url = `${connection.baseUrl}/drift/session-decisions` +
            `?claudeSessionId=${encodeURIComponent(sessionId)}&limit=${limit}`;
        const response = await runtime.fetchImpl(url, {
            headers: authHeaders(connection),
            signal: AbortSignal.timeout(hookTimeoutMs(runtime.env)),
        });
        if (!response.ok)
            return 0;
        const body = (await response.json());
        decisions = Array.isArray(body.decisions)
            ? body.decisions.filter(isDecisionItem)
            : [];
    }
    catch {
        // Server unreachable — degrade silently for this turn (spec §1.4).
        return 0;
    }
    if (decisions.length === 0)
        return 0;
    const lines = decisions.map((decision, index) => {
        const label = decision.thoughtType === 'assumption_update'
            ? 'Correction'
            : 'Decision';
        const text = decision.thought.length > MAX_DECISION_CHARS
            ? `${decision.thought.slice(0, MAX_DECISION_CHARS)}…`
            : decision.thought;
        return `${label} #${index + 1} (thought ${decision.thoughtNumber}): ${text}`;
    });
    const block = [
        '<system-reminder type="session-decisions">',
        'Decisions and corrections recorded earlier in this session (most recent first):',
        ...lines,
        'These remain binding unless the user explicitly reverses them. Do not re-propose rejected approaches.',
        '</system-reminder>',
    ].join('\n');
    runtime.writeStdout(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: 'UserPromptSubmit',
            additionalContext: block,
        },
    }));
    return 0;
}
function isDecisionItem(value) {
    if (!value || typeof value !== 'object')
        return false;
    const item = value;
    return (typeof item.thoughtNumber === 'number' &&
        typeof item.thoughtType === 'string' &&
        typeof item.thought === 'string');
}
function reminderLimit(env) {
    const parsed = Number.parseInt(env.THOUGHTBOX_DRIFT_REMINDER_LIMIT ?? '', 10);
    if (!Number.isFinite(parsed) || parsed < 1)
        return DEFAULT_REMINDER_LIMIT;
    return Math.min(parsed, MAX_REMINDER_LIMIT);
}
// ---------------------------------------------------------------------------
// promote-to-decision (spec §4)
// ---------------------------------------------------------------------------
/**
 * Correction-language patterns (spec §4.2). False positives are tolerable:
 * a noisy correction falls out of the top-N reminder quickly; a missed one
 * is a durable drift risk.
 */
const DEFAULT_CORRECTION_PATTERNS = [
    /^\s*(no|nope|stop|don't|do not|never|wrong)\b/i,
    /^\s*(actually|wait)[,\s]/i,
    /\bwe (already )?(removed|deleted|dropped|decided|agreed|rejected)\b/i,
    /\bthat'?s (wrong|not right|incorrect|not what)\b/i,
    /\byou'?re wrong\b/i,
    /\bi (already )?told you\b/i,
    /\bhow many times\b/i,
    /\bstop (doing|adding|proposing|suggesting)\b/i,
];
export function matchesCorrectionLanguage(prompt, env) {
    const patterns = [
        ...DEFAULT_CORRECTION_PATTERNS,
        ...parseRegexListEnv(env.THOUGHTBOX_DECISION_PATTERNS),
    ];
    return patterns.some((pattern) => pattern.test(prompt));
}
export async function runPromoteToDecision(args, runtime) {
    const payload = await readHookPayload(args, runtime);
    const sessionId = stringField(payload, 'session_id');
    const prompt = stringField(payload, 'prompt');
    if (!sessionId || !prompt)
        return 0;
    // Pattern check is local and happens BEFORE any detach/network work, so
    // non-correction turns (the overwhelming majority) cost nothing.
    if (!matchesCorrectionLanguage(prompt, runtime.env))
        return 0;
    if (!isSyncDelivery(args, runtime.env)) {
        try {
            await spawnDetachedSelf('promote-to-decision', { session_id: sessionId, prompt }, runtime.env);
        }
        catch (error) {
            runtime.writeStderr(`thoughtbox promote-to-decision: detach failed (${describe(error)})`);
        }
        return 0;
    }
    const connection = await resolveHookConnection(runtime);
    if (!connection)
        return 0;
    try {
        await runtime.fetchImpl(`${connection.baseUrl}/drift/session-thought`, {
            method: 'POST',
            headers: authHeaders(connection),
            body: JSON.stringify({
                claudeSessionId: sessionId,
                thoughtType: 'assumption_update',
                content: prompt,
                reviseLatestUserTurn: true,
                assumptionChange: {
                    text: prompt,
                    oldStatus: 'believed',
                    newStatus: 'refuted',
                    trigger: 'user-correction-language',
                },
            }),
            signal: AbortSignal.timeout(hookTimeoutMs(runtime.env)),
        });
    }
    catch (error) {
        runtime.writeStderr(`thoughtbox promote-to-decision: delivery failed (${describe(error)})`);
    }
    return 0;
}
const VERIFICATION_TOOLS = new Set(['Read', 'Grep', 'Glob', 'Bash']);
/**
 * Assertion patterns about repo state (spec §5.2). Each regex must expose
 * the asserted target as capture group 1.
 */
const DEFAULT_ASSERTION_PATTERNS = [
    /\bthe file ([\w@./-]+) (?:is|contains|has|still|now|exports|defines)\b/gi,
    /\b([\w@./-]*\/[\w@./-]+|[\w@-]+\.[a-z]{1,6}) still (?:has|contains|uses|imports|exports|references|exists|points)\b/gi,
    /\bthe current state of ([\w@./-]+)/gi,
    /\b(package\.json) (?:has|contains|includes|lists|declares|is)\b/gi,
    /\bthe ([\w@./-]*\/[\w@./-]+|[\w@-]+\.[a-z]{1,6}) (?:is|contains|has|exports|defines)\b/gi,
];
export function findUnverifiedAssertions(turn, env) {
    const patterns = [
        ...DEFAULT_ASSERTION_PATTERNS,
        ...parseRegexListEnv(env.THOUGHTBOX_AUDIT_PATTERNS).map((regex) => new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`)),
    ];
    const targets = new Set();
    for (const pattern of patterns) {
        pattern.lastIndex = 0;
        for (const match of turn.responseText.matchAll(pattern)) {
            const target = match[1];
            if (target && looksLikeRepoTarget(target))
                targets.add(target);
        }
    }
    const verificationBlobs = turn.toolUses
        .filter((use) => VERIFICATION_TOOLS.has(baseToolName(use.name)))
        .map((use) => {
        try {
            return JSON.stringify(use.input) ?? '';
        }
        catch {
            return '';
        }
    });
    return [...targets].filter((target) => {
        const needle = target.split('/').pop() ?? target;
        return !verificationBlobs.some((blob) => blob.includes(needle));
    });
}
function baseToolName(name) {
    // MCP-namespaced tools look like mcp__server__ToolName; keep the tail.
    const parts = name.split('__');
    return parts[parts.length - 1] || name;
}
function looksLikeRepoTarget(target) {
    if (target.length < 3 || target.length > 200)
        return false;
    if (!/[./]/.test(target))
        return false;
    if (/^(e\.g|i\.e|etc|vs)\.?$/i.test(target))
        return false;
    if (target.endsWith('.'))
        return false;
    return /^[\w@./-]+$/.test(target);
}
/**
 * Parse the just-completed turn out of a Claude Code transcript (JSONL).
 * The turn starts after the last real user prompt (a `user` entry whose
 * content is a string or contains a text block, not just tool_results).
 */
export function parseLastTurn(transcript) {
    const entries = [];
    for (const line of transcript.split('\n')) {
        if (!line.trim())
            continue;
        try {
            entries.push(JSON.parse(line));
        }
        catch {
            // Skip unparseable lines rather than failing the audit closed.
        }
    }
    let lastUserIndex = -1;
    for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (entry.type !== 'user')
            continue;
        const content = entry.message?.content;
        const isRealPrompt = typeof content === 'string' ||
            (Array.isArray(content) &&
                content.some((block) => block.type === 'text'));
        if (isRealPrompt) {
            lastUserIndex = i;
            break;
        }
    }
    const textParts = [];
    const toolUses = [];
    for (const entry of entries.slice(lastUserIndex + 1)) {
        if (entry.type !== 'assistant')
            continue;
        const content = entry.message?.content;
        if (!Array.isArray(content))
            continue;
        for (const block of content) {
            if (block.type === 'text' && typeof block.text === 'string') {
                textParts.push(block.text);
            }
            else if (block.type === 'tool_use' && typeof block.name === 'string') {
                toolUses.push({ name: block.name, input: block.input });
            }
        }
    }
    return { responseText: textParts.join('\n'), toolUses };
}
export async function runAuditResponse(args, runtime) {
    const payload = await readHookPayload(args, runtime);
    if (!payload)
        return 0;
    // Claude Code sets stop_hook_active when the turn is already continuing
    // because of a Stop-hook block; never block twice for the same turn.
    if (payload.stop_hook_active === true)
        return 0;
    const transcriptPath = stringField(payload, 'transcript_path');
    if (!transcriptPath)
        return 0;
    let turn;
    try {
        turn = parseLastTurn(await readFile(transcriptPath, 'utf8'));
    }
    catch {
        return 0;
    }
    if (!turn.responseText)
        return 0;
    const unverified = findUnverifiedAssertions(turn, runtime.env);
    if (unverified.length === 0)
        return 0;
    const reason = unverified
        .map((target) => `Assertion about ${target} was not verified in this turn. ` +
        `Either cite the file:line you read, or remove the claim.`)
        .join(' ');
    runtime.writeStdout(JSON.stringify({ decision: 'block', reason }));
    return 0;
}
// ---------------------------------------------------------------------------
// dispatcher
// ---------------------------------------------------------------------------
export async function runHookCommand(argv, runtime) {
    const hookName = argv[0];
    const rest = argv.slice(1);
    switch (hookName) {
        case 'capture-user-turn':
            return runCaptureUserTurn(rest, runtime);
        case 'surface-decisions':
            return runSurfaceDecisions(rest, runtime);
        case 'promote-to-decision':
            return runPromoteToDecision(rest, runtime);
        case 'audit-response':
            return runAuditResponse(rest, runtime);
        default:
            runtime.writeStderr(`error: unknown hook "${hookName ?? ''}" (expected capture-user-turn, surface-decisions, promote-to-decision, or audit-response)`);
            // Unknown hook names still exit 0: a plugin/CLI version skew must
            // never block the user's turn.
            return 0;
    }
}
function stringField(payload, field) {
    const value = payload?.[field];
    return typeof value === 'string' && value.trim() ? value : null;
}
function describe(error) {
    return error instanceof Error ? error.message : String(error);
}
