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
import { type HookRuntime } from './hook-common.js';
export declare function runCaptureUserTurn(args: string[], runtime: HookRuntime): Promise<number>;
export declare function runSurfaceDecisions(args: string[], runtime: HookRuntime): Promise<number>;
export declare function matchesCorrectionLanguage(prompt: string, env: NodeJS.ProcessEnv): boolean;
export declare function runPromoteToDecision(args: string[], runtime: HookRuntime): Promise<number>;
interface TurnRecord {
    responseText: string;
    toolUses: Array<{
        name: string;
        input: unknown;
    }>;
}
export declare function findUnverifiedAssertions(turn: TurnRecord, env: NodeJS.ProcessEnv): string[];
/**
 * Parse the just-completed turn out of a Claude Code transcript (JSONL).
 * The turn starts after the last real user prompt (a `user` entry whose
 * content is a string or contains a text block, not just tool_results).
 */
export declare function parseLastTurn(transcript: string): TurnRecord;
export declare function runAuditResponse(args: string[], runtime: HookRuntime): Promise<number>;
export declare function runHookCommand(argv: string[], runtime: HookRuntime): Promise<number>;
export {};
