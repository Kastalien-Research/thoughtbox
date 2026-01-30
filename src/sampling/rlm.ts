import vm from "vm";
import { SamplingHandler, type SamplingResult, type SamplingParams, type ModelPreferences, type SamplingMessage } from "./handler.js";

interface RlmRunOptions {
  query: string;
  context: string | Record<string, unknown>;
  maxIterations?: number;
  rootModelPreferences?: ModelPreferences;
  subModelPreferences?: ModelPreferences;
  maxTokens?: number;
  subMaxTokens?: number;
  execTimeoutMs?: number;
}

export interface RlmResult {
  text: string;
  model?: string;
  iterations: number;
  logs: string[];
}

const DEFAULT_MAX_ITERATIONS = 12;
const DEFAULT_EXEC_TIMEOUT_MS = 5000;
const DEFAULT_ROOT_MAX_TOKENS = 1500;
const DEFAULT_SUB_MAX_TOKENS = 1200;

const ROOT_SYSTEM_PROMPT = `You are a recursive language model operating inside a JavaScript REPL.

Environment:
- A variable named context holds the user's corpus (string or JSON-serializable data).
- Call llm_query(prompt) to send a sub-LLM request (large window, but metered).
- Use console.log for inspection; outputs are truncated when sent back to you.
- Return the final answer with FINAL(value) or FINAL_VAR(varName).

Rules:
- Wrap any code to run in \\\`\\\`\\\`repl blocks.
- Do not ask for more context; inspect the context variable or call llm_query with slices.
- Avoid network, filesystem, or os calls (they are unavailable).
- Be concise. Plan, execute, then finalize with FINAL/FINAL_VAR.`;

function extractReplBlocks(text: string): string[] {
  const pattern = /```repl\\s*\\n([\\s\\S]*?)\\n```/g;
  const blocks: string[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

function findFinalMarker(text: string): { type: "FINAL" | "FINAL_VAR"; content: string } | null {
  const finalVar = /^\s*FINAL_VAR\((.*?)\)/m.exec(text);
  if (finalVar?.[1]) return { type: "FINAL_VAR", content: finalVar[1].trim() };

  const final = /^\s*FINAL\((.*?)\)/m.exec(text);
  if (final?.[1]) return { type: "FINAL", content: final[1].trim() };

  return null;
}

function safeStringify(value: unknown, limit = 4000): string {
  try {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    return text.length > limit ? text.slice(0, limit) + "..." : text;
  } catch {
    return String(value).slice(0, limit);
  }
}

function buildUserPrompt(query: string, iteration: number): string {
  if (iteration === 0) {
    return `Query: ${query}

Use the REPL to inspect context and plan. Wrap code in \`\`\`repl fences. Do not provide the final answer yet; explore first.`;
  }
  return `Continue working on: ${query}.
If you need more information, inspect context or call llm_query. When ready, return FINAL(...) or FINAL_VAR(...).`;
}

class ReplRunner {
  private sandbox: vm.Context;
  private stdout: string[] = [];
  private finalValue: string | null = null;
  private execTimeout: number;

  constructor(
    contextValue: string | Record<string, unknown>,
    private llmQuery: (prompt: string) => Promise<string>,
    execTimeoutMs: number = DEFAULT_EXEC_TIMEOUT_MS
  ) {
    this.execTimeout = execTimeoutMs;
    this.sandbox = this.createSandbox(contextValue);
  }

  private createSandbox(contextValue: string | Record<string, unknown>): vm.Context {
    const stdout = this.stdout;
    const state: Record<string, unknown> = {
      context: contextValue,
    };

    const consoleStub = {
      log: (...args: unknown[]) => stdout.push(args.map((a) => safeStringify(a, 500)).join(" ")),
    };

    const FINAL = (value: unknown) => {
      this.finalValue = safeStringify(value);
    };

    const FINAL_VAR = (name: string) => {
      const key = name.trim().replace(/^['"]|['"]$/g, "");
      this.finalValue = safeStringify((state as any)[key]);
    };

    const sandbox: Record<string, unknown> = {
      console: consoleStub,
      context: state.context,
      llm_query: this.llmQuery,
      FINAL,
      FINAL_VAR,

      // Safe built-ins
      Math,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object,
      Date,
      RegExp,
      Set,
      Map,
      WeakSet,
      WeakMap,
      TextEncoder,
      TextDecoder,
      parseInt,
      parseFloat,
      encodeURIComponent,
      decodeURIComponent,

      // Disable dangerous globals
      process: undefined,
      require: undefined,
      Function: undefined,
      eval: undefined,
      AsyncFunction: undefined,
      setImmediate: undefined,
      setTimeout: undefined,
      setInterval: undefined,
    };

    const ctx = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
    // Preserve reference to mutable state
    (ctx as any).__state = state;
    return ctx;
  }

  getFinal(): string | null {
    return this.finalValue;
  }

  getVariable(name: string): unknown {
    const key = name.trim().replace(/^['"]|['"]$/g, "");
    return (this.sandbox as any)[key];
  }

  private collectStdout(fromIndex: number): string {
    return this.stdout.slice(fromIndex).join("\n").trim();
  }

  async run(code: string): Promise<{ stdout: string; stderr?: string; final?: string }> {
    // Keep state across runs
    const startIndex = this.stdout.length;
    this.finalValue = null;
    const wrapped = `(async () => {\n${code}\n})();`;
    try {
      const script = new vm.Script(wrapped);
      const result = script.runInContext(this.sandbox, { timeout: this.execTimeout });
      // Ensure async completion is awaited with timeout
      await Promise.race([
        Promise.resolve(result),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Execution timed out after ${this.execTimeout}ms`)), this.execTimeout + 10)
        ),
      ]);
      return {
        stdout: this.collectStdout(startIndex),
        final: this.finalValue ?? undefined,
      };
    } catch (error: any) {
      return {
        stdout: this.collectStdout(startIndex),
        stderr: error?.message || String(error),
        final: this.finalValue ?? undefined,
      };
    }
  }
}

export class RLMOrchestrator {
  constructor(private samplingHandler: SamplingHandler) {}

  async run(options: RlmRunOptions): Promise<RlmResult> {
    const {
      query,
      context,
      maxIterations = DEFAULT_MAX_ITERATIONS,
      rootModelPreferences,
      subModelPreferences,
      maxTokens = DEFAULT_ROOT_MAX_TOKENS,
      subMaxTokens = DEFAULT_SUB_MAX_TOKENS,
      execTimeoutMs = DEFAULT_EXEC_TIMEOUT_MS,
    } = options;

    const messages: SamplingMessage[] = [
      { role: "system", content: { type: "text", text: ROOT_SYSTEM_PROMPT } },
      { role: "user", content: { type: "text", text: buildUserPrompt(query, 0) } },
    ];

    const logs: string[] = [];
    const runner = new ReplRunner(context, (prompt: string) => this.runSubQuery(prompt, subModelPreferences, subMaxTokens), execTimeoutMs);

    for (let i = 0; i < maxIterations; i++) {
      const response = await this.samplingHandler.requestMessage({
        messages,
        includeContext: "none",
        modelPreferences: rootModelPreferences,
        maxTokens,
      } satisfies SamplingParams);

      messages.push({
        role: "assistant",
        content: { type: "text", text: response.content.text },
      });

      const finalMarker = findFinalMarker(response.content.text);
      if (finalMarker) {
        const value =
          finalMarker.type === "FINAL_VAR"
            ? safeStringify(runner.getVariable(finalMarker.content))
            : finalMarker.content;
        const text = value || response.content.text;
        return { text, model: response.model, iterations: i + 1, logs };
      }

      const blocks = extractReplBlocks(response.content.text);
      let earlyFinal: string | null = null;

      for (const block of blocks) {
        const execResult = await runner.run(block);
        const formatted = this.formatExecution(block, execResult);
        logs.push(formatted);

        messages.push({
          role: "user",
          content: { type: "text", text: formatted },
        });

        if (execResult.final) {
          earlyFinal = execResult.final;
          break;
        }
      }

      if (earlyFinal) {
        return { text: earlyFinal, model: response.model, iterations: i + 1, logs };
      }

      // Add follow-up prompt to continue reasoning
      messages.push({
        role: "user",
        content: { type: "text", text: buildUserPrompt(query, i + 1) },
      });
    }

    // Fallback: request final answer directly
    const finalResponse = await this.samplingHandler.requestMessage({
      messages: [
        ...messages,
        {
          role: "user",
          content: {
            type: "text",
            text: `Provide the final answer for: ${query}. Do not include code fences; respond directly.`,
          },
        },
      ],
      includeContext: "none",
      modelPreferences: rootModelPreferences,
      maxTokens,
    } satisfies SamplingParams);

    return { text: finalResponse.content.text, model: finalResponse.model, iterations: maxIterations + 1, logs };
  }

  private async runSubQuery(prompt: string, modelPreferences?: ModelPreferences, maxTokens?: number): Promise<string> {
    const result: SamplingResult = await this.samplingHandler.requestMessage({
      messages: [
        {
          role: "user",
          content: { type: "text", text: prompt },
        },
      ],
      includeContext: "none",
      modelPreferences,
      maxTokens: maxTokens ?? DEFAULT_SUB_MAX_TOKENS,
    });

    return result.content.text;
  }

  private formatExecution(code: string, result: { stdout: string; stderr?: string; final?: string }): string {
    const parts: string[] = [];
    parts.push("Code executed:\n```repl\n" + code + "\n```");
    if (result.stdout) parts.push(`REPL stdout:\n${result.stdout.slice(0, 4000)}`);
    if (result.stderr) parts.push(`REPL error:\n${result.stderr.slice(0, 1000)}`);
    if (result.final) parts.push(`FINAL (from execution):\n${result.final}`);
    return parts.join("\n\n");
  }
}
