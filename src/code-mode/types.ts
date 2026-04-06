/**
 * Code Mode shared types.
 */

/**
 * Stable response envelope for both Code Mode tools.
 * Every search and execute call returns this shape.
 */
export interface CodeModeResult {
  /** The return value from the executed code */
  result: unknown;
  /** Captured console.log/warn/error output */
  logs: string[];
  /** Error message if execution failed */
  error?: string;
  /** True if the result was truncated due to size limits */
  truncated?: boolean;
  /** Wall-clock execution time in milliseconds */
  durationMs: number;
  /** Active Thoughtbox session ID (captured from tb.thought calls) */
  sessionId?: string;
}
