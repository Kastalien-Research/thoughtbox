/**
 * Shared plumbing for the drift-prevention hook subcommand family
 * (SPEC-DRIFT-PREVENTION-HOOKS §7).
 *
 * Every helper here fails open: a missing config, unreachable server, or
 * malformed payload must never block the user's turn.
 */
export interface HookConnection {
    baseUrl: string;
    apiKey: string | null;
}
export interface HookRuntime {
    cwd: string;
    env: NodeJS.ProcessEnv;
    fetchImpl: typeof fetch;
    writeStdout: (line: string) => void;
    writeStderr: (line: string) => void;
    stdinText?: string;
}
/** Default network budget per hook call. Overridable for tests/harnesses. */
export declare const DEFAULT_HOOK_TIMEOUT_MS = 2000;
export declare function hookTimeoutMs(env: NodeJS.ProcessEnv): number;
/**
 * Read the Claude Code hook payload. Order: explicit `--payload-file <path>`
 * (used by detached re-invocation; the file is deleted after reading),
 * injected stdin text (tests), then process stdin.
 */
export declare function readHookPayload(args: string[], runtime: HookRuntime): Promise<Record<string, unknown> | null>;
/**
 * Resolve the Thoughtbox server base URL and API key exactly the way
 * protocol_gate.sh and the channel do: explicit env override first, then
 * the config `thoughtbox init` wrote to `.claude/settings.local.json`.
 * Returns null when unconfigured — callers fail open.
 */
export declare function resolveHookConnection(runtime: Pick<HookRuntime, 'cwd' | 'env'>): Promise<HookConnection | null>;
export declare function authHeaders(connection: HookConnection): Record<string, string>;
/**
 * Whether this invocation must run its network delivery inline.
 * True for detached re-invocations (`--sync`) and for harnesses/tests
 * (THOUGHTBOX_HOOK_SYNC=1) that need to observe the request.
 */
export declare function isSyncDelivery(args: string[], env: NodeJS.ProcessEnv): boolean;
/**
 * Re-invoke this CLI detached from the current process so UserPromptSubmit
 * returns immediately (spec §2.5/§4.4 "async" requirement). The payload
 * travels via a temp file the child deletes after reading.
 */
export declare function spawnDetachedSelf(hookName: string, payload: Record<string, unknown>, env: NodeJS.ProcessEnv): Promise<void>;
/** Parse a JSON-array-of-strings env var into RegExp objects, tolerantly. */
export declare function parseRegexListEnv(value: string | undefined): RegExp[];
