import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../cli/main.js';
import { parseLastTurn } from '../cli/hooks.js';

type FetchMock = ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

interface RunResult {
  code: number | null;
  stdout: string[];
  stderr: string[];
}

async function runHook(
  hookName: string,
  payload: unknown,
  options: {
    fetchImpl?: FetchMock;
    env?: NodeJS.ProcessEnv;
  } = {},
): Promise<RunResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const fetchImpl =
    options.fetchImpl ?? vi.fn(async () => jsonResponse({ ok: true }));

  const code = await runCli(['hook', hookName], {
    cwd: '/nonexistent-project-dir',
    env: {
      THOUGHTBOX_HOOK_SYNC: '1',
      THOUGHTBOX_URL: 'https://tb.example.test',
      THOUGHTBOX_API_KEY: 'tbx_test_key',
      ...options.env,
    },
    fetchImpl: fetchImpl as unknown as typeof fetch,
    stdinText: JSON.stringify(payload),
    writeStdout: (line) => stdout.push(line),
    writeStderr: (line) => stderr.push(line),
  });

  return { code, stdout, stderr };
}

describe('thoughtbox hook capture-user-turn', () => {
  it('posts the user prompt as a context_snapshot', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ sessionId: 's1' }));
    const result = await runHook(
      'capture-user-turn',
      { session_id: 'cc-1', prompt: 'use pnpm, never npm' },
      { fetchImpl },
    );

    expect(result.code).toBe(0);
    expect(result.stdout).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://tb.example.test/drift/session-thought');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer tbx_test_key',
    );
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      claudeSessionId: 'cc-1',
      thoughtType: 'context_snapshot',
      content: 'use pnpm, never npm',
    });
    expect(body.tags).toContain('user-turn');
  });

  it('fails open with exit 0 when unconfigured (no fetch, no stdout)', async () => {
    const fetchImpl = vi.fn();
    const result = await runHook(
      'capture-user-turn',
      { session_id: 'cc-1', prompt: 'hello' },
      {
        fetchImpl,
        env: {
          THOUGHTBOX_URL: '',
          THOUGHTBOX_API_KEY: '',
          OTEL_EXPORTER_OTLP_ENDPOINT: '',
        },
      },
    );

    expect(result.code).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.stdout).toEqual([]);
    expect(result.stderr.join(' ')).toContain('no Thoughtbox endpoint');
  });

  it('fails open with exit 0 when the server is unreachable', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    const result = await runHook(
      'capture-user-turn',
      { session_id: 'cc-1', prompt: 'hello' },
      { fetchImpl },
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toEqual([]);
  });

  it('ignores payloads without a prompt', async () => {
    const fetchImpl = vi.fn();
    const result = await runHook(
      'capture-user-turn',
      { session_id: 'cc-1' },
      { fetchImpl },
    );
    expect(result.code).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('thoughtbox hook surface-decisions', () => {
  it('emits a session-decisions system reminder via additionalContext', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        sessionId: 'tb-session',
        decisions: [
          {
            thoughtNumber: 7,
            thoughtType: 'decision_frame',
            thought: 'Decided: Supabase-only persistence',
            timestamp: '2026-07-09T00:00:00Z',
          },
          {
            thoughtNumber: 5,
            thoughtType: 'assumption_update',
            thought: 'no, we removed the redis dependency',
            timestamp: '2026-07-09T00:00:00Z',
          },
        ],
        count: 2,
      }),
    );

    const result = await runHook(
      'surface-decisions',
      { session_id: 'cc-2', prompt: 'next task' },
      { fetchImpl },
    );

    expect(result.code).toBe(0);
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toBe(
      'https://tb.example.test/drift/session-decisions?claudeSessionId=cc-2&limit=10',
    );

    expect(result.stdout).toHaveLength(1);
    const output = JSON.parse(result.stdout[0]);
    expect(output.hookSpecificOutput.hookEventName).toBe('UserPromptSubmit');
    const context: string = output.hookSpecificOutput.additionalContext;
    expect(context).toContain('<system-reminder type="session-decisions">');
    expect(context).toContain(
      'Decision #1 (thought 7): Decided: Supabase-only persistence',
    );
    expect(context).toContain(
      'Correction #2 (thought 5): no, we removed the redis dependency',
    );
  });

  it('emits nothing when the session has no decisions', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ sessionId: null, decisions: [], count: 0 }),
    );
    const result = await runHook(
      'surface-decisions',
      { session_id: 'cc-2' },
      { fetchImpl },
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toEqual([]);
  });

  it('degrades silently when the server is unreachable', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('timeout');
    });
    const result = await runHook(
      'surface-decisions',
      { session_id: 'cc-2' },
      { fetchImpl },
    );
    expect(result.code).toBe(0);
    expect(result.stdout).toEqual([]);
  });

  it('honors THOUGHTBOX_DRIFT_REMINDER_LIMIT with a max of 25', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ decisions: [], count: 0 }),
    );
    await runHook(
      'surface-decisions',
      { session_id: 'cc-2' },
      { fetchImpl, env: { THOUGHTBOX_DRIFT_REMINDER_LIMIT: '99' } },
    );
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain('limit=25');
  });
});

describe('thoughtbox hook promote-to-decision', () => {
  it('does nothing (no network) for non-correction prompts', async () => {
    const fetchImpl = vi.fn();
    const result = await runHook(
      'promote-to-decision',
      { session_id: 'cc-3', prompt: 'please add a test for the parser' },
      { fetchImpl },
    );
    expect(result.code).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('promotes correction-language prompts to refuted assumption_updates', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ thoughtNumber: 2 }));
    const prompt = "no, we removed that config — stop adding it back";
    const result = await runHook(
      'promote-to-decision',
      { session_id: 'cc-3', prompt },
      { fetchImpl },
    );

    expect(result.code).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://tb.example.test/drift/session-thought');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      claudeSessionId: 'cc-3',
      thoughtType: 'assumption_update',
      content: prompt,
      reviseLatestUserTurn: true,
    });
    expect(body.assumptionChange.newStatus).toBe('refuted');
  });

  it('supports additional patterns via THOUGHTBOX_DECISION_PATTERNS', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}));
    await runHook(
      'promote-to-decision',
      { session_id: 'cc-3', prompt: 'per the ADR this is settled' },
      {
        fetchImpl,
        env: { THOUGHTBOX_DECISION_PATTERNS: '["per the ADR"]' },
      },
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('thoughtbox hook audit-response', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'tb-audit-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  function transcriptLine(entry: unknown): string {
    return JSON.stringify(entry);
  }

  async function writeTranscript(lines: string[]): Promise<string> {
    const transcriptPath = path.join(dir, 'transcript.jsonl');
    await writeFile(transcriptPath, lines.join('\n'), 'utf8');
    return transcriptPath;
  }

  const userPrompt = transcriptLine({
    type: 'user',
    message: { role: 'user', content: 'what does the config do?' },
  });

  it('blocks unverified repo-state assertions', async () => {
    const transcriptPath = await writeTranscript([
      userPrompt,
      transcriptLine({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'The file src/config/loader.ts contains the retry logic.',
            },
          ],
        },
      }),
    ]);

    const result = await runHook('audit-response', {
      session_id: 'cc-4',
      transcript_path: transcriptPath,
      stop_hook_active: false,
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toHaveLength(1);
    const output = JSON.parse(result.stdout[0]);
    expect(output.decision).toBe('block');
    expect(output.reason).toContain('src/config/loader.ts');
    expect(output.reason).toContain('was not verified in this turn');
  });

  it('passes assertions backed by a Read of the referenced file', async () => {
    const transcriptPath = await writeTranscript([
      userPrompt,
      transcriptLine({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              name: 'Read',
              input: { file_path: '/repo/src/config/loader.ts' },
            },
          ],
        },
      }),
      transcriptLine({
        type: 'user',
        message: {
          role: 'user',
          content: [{ type: 'tool_result', content: 'file contents...' }],
        },
      }),
      transcriptLine({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'The file src/config/loader.ts contains the retry logic (loader.ts:42).',
            },
          ],
        },
      }),
    ]);

    const result = await runHook('audit-response', {
      session_id: 'cc-4',
      transcript_path: transcriptPath,
      stop_hook_active: false,
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toEqual([]);
  });

  it('only audits the turn after the last real user prompt', async () => {
    const transcriptPath = await writeTranscript([
      transcriptLine({
        type: 'user',
        message: { role: 'user', content: 'earlier question' },
      }),
      transcriptLine({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'The file src/old/stale.ts contains legacy assertions.',
            },
          ],
        },
      }),
      userPrompt,
      transcriptLine({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'All done, nothing asserted.' }],
        },
      }),
    ]);

    const result = await runHook('audit-response', {
      session_id: 'cc-4',
      transcript_path: transcriptPath,
      stop_hook_active: false,
    });

    expect(result.stdout).toEqual([]);
  });

  it('never blocks twice for the same turn (stop_hook_active)', async () => {
    const transcriptPath = await writeTranscript([userPrompt]);
    const result = await runHook('audit-response', {
      session_id: 'cc-4',
      transcript_path: transcriptPath,
      stop_hook_active: true,
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toEqual([]);
  });

  it('fails open when the transcript is missing or unparseable', async () => {
    const result = await runHook('audit-response', {
      session_id: 'cc-4',
      transcript_path: path.join(dir, 'does-not-exist.jsonl'),
      stop_hook_active: false,
    });
    expect(result.code).toBe(0);
    expect(result.stdout).toEqual([]);
  });
});

describe('parseLastTurn', () => {
  it('collects assistant text and tool uses after the last user prompt', () => {
    const transcript = [
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'do the thing' },
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Working on it.' },
            { type: 'tool_use', name: 'Grep', input: { pattern: 'retry' } },
          ],
        },
      }),
      'not-json-garbage',
      JSON.stringify({
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Done.' }],
        },
      }),
    ].join('\n');

    const turn = parseLastTurn(transcript);
    expect(turn.responseText).toBe('Working on it.\nDone.');
    expect(turn.toolUses).toEqual([
      { name: 'Grep', input: { pattern: 'retry' } },
    ]);
  });
});

describe('thoughtbox hook dispatcher', () => {
  it('exits 0 for unknown hook names (version-skew safety)', async () => {
    const result = await runHook('does-not-exist', {});
    expect(result.code).toBe(0);
    expect(result.stderr.join(' ')).toContain('unknown hook');
  });
});
