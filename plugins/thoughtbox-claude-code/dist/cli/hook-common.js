/**
 * Shared plumbing for the drift-prevention hook subcommand family
 * (SPEC-DRIFT-PREVENTION-HOOKS §7).
 *
 * Every helper here fails open: a missing config, unreachable server, or
 * malformed payload must never block the user's turn.
 */
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { extractApiKeyFromLocalConfig, findOtelEndpoint, findThoughtboxBaseUrl, loadLocalThoughtboxConfig, } from './config.js';
/** Default network budget per hook call. Overridable for tests/harnesses. */
export const DEFAULT_HOOK_TIMEOUT_MS = 2_000;
export function hookTimeoutMs(env) {
    const parsed = Number.parseInt(env.THOUGHTBOX_HOOK_TIMEOUT_MS ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_HOOK_TIMEOUT_MS;
}
/**
 * Read the Claude Code hook payload. Order: explicit `--payload-file <path>`
 * (used by detached re-invocation; the file is deleted after reading),
 * injected stdin text (tests), then process stdin.
 */
export async function readHookPayload(args, runtime) {
    let raw;
    const fileFlag = args.indexOf('--payload-file');
    if (fileFlag !== -1 && args[fileFlag + 1]) {
        const payloadPath = args[fileFlag + 1];
        try {
            raw = await readFile(payloadPath, 'utf8');
        }
        catch {
            return null;
        }
        finally {
            unlink(payloadPath).catch(() => { });
        }
    }
    else if (runtime.stdinText !== undefined) {
        raw = runtime.stdinText;
    }
    else {
        raw = await readStdin();
    }
    if (!raw || !raw.trim())
        return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : null;
    }
    catch {
        return null;
    }
}
async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf8');
}
/**
 * Resolve the Thoughtbox server base URL and API key exactly the way
 * protocol_gate.sh and the channel do: explicit env override first, then
 * the config `thoughtbox init` wrote to `.claude/settings.local.json`.
 * Returns null when unconfigured — callers fail open.
 */
export async function resolveHookConnection(runtime) {
    const { env } = runtime;
    const projectDir = env.CLAUDE_PROJECT_DIR ?? runtime.cwd;
    let baseUrl = env.THOUGHTBOX_URL ?? env.OTEL_EXPORTER_OTLP_ENDPOINT ?? null;
    let apiKey = env.THOUGHTBOX_API_KEY ?? null;
    if (!apiKey && env.OTEL_EXPORTER_OTLP_HEADERS) {
        const match = env.OTEL_EXPORTER_OTLP_HEADERS.match(/Authorization=Bearer\s+([^,\s]+)/);
        if (match?.[1])
            apiKey = match[1];
    }
    if (!baseUrl || !apiKey) {
        try {
            const config = await loadLocalThoughtboxConfig(projectDir);
            baseUrl =
                baseUrl ??
                    findOtelEndpoint(config.settingsLocal) ??
                    findThoughtboxBaseUrl(config.settingsLocal);
            apiKey = apiKey ?? extractApiKeyFromLocalConfig(config.settingsLocal);
        }
        catch {
            // Unreadable local settings — fall through to whatever env gave us.
        }
    }
    if (!baseUrl)
        return null;
    return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };
}
export function authHeaders(connection) {
    return {
        'Content-Type': 'application/json',
        ...(connection.apiKey
            ? { Authorization: `Bearer ${connection.apiKey}` }
            : {}),
    };
}
/**
 * Whether this invocation must run its network delivery inline.
 * True for detached re-invocations (`--sync`) and for harnesses/tests
 * (THOUGHTBOX_HOOK_SYNC=1) that need to observe the request.
 */
export function isSyncDelivery(args, env) {
    return args.includes('--sync') || env.THOUGHTBOX_HOOK_SYNC === '1';
}
/**
 * Re-invoke this CLI detached from the current process so UserPromptSubmit
 * returns immediately (spec §2.5/§4.4 "async" requirement). The payload
 * travels via a temp file the child deletes after reading.
 */
export async function spawnDetachedSelf(hookName, payload, env) {
    const payloadPath = path.join(os.tmpdir(), `thoughtbox-hook-${randomUUID()}.json`);
    await writeFile(payloadPath, JSON.stringify(payload), 'utf8');
    const here = path.dirname(fileURLToPath(import.meta.url));
    const binPath = path.resolve(here, '..', '..', 'bin', 'thoughtbox');
    const child = spawn(process.execPath, [binPath, 'hook', hookName, '--sync', '--payload-file', payloadPath], { detached: true, stdio: 'ignore', env: { ...env } });
    child.unref();
}
/** Parse a JSON-array-of-strings env var into RegExp objects, tolerantly. */
export function parseRegexListEnv(value) {
    if (!value)
        return [];
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed))
            return [];
        return parsed
            .filter((item) => typeof item === 'string')
            .flatMap((pattern) => {
            try {
                return [new RegExp(pattern, 'i')];
            }
            catch {
                return [];
            }
        });
    }
    catch {
        return [];
    }
}
