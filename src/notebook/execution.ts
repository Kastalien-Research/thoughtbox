import { spawn, ChildProcess } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { CodeLanguage } from "./types.js";

export interface REPLMessage {
  type:
    | "store"
    | "peek"
    | "vars"
    | "final"
    | "sub_call"
    | "response";
  reqId: number;
  name?: string;
  value?: string;
  start?: number;
  end?: number;
  result?: unknown;
  error?: string;
  prompt?: string;
}

export interface REPLHandler {
  onStore(name: string, value: string): Promise<void>;
  onPeek(
    name: string,
    start?: number,
    end?: number
  ): Promise<{ value: string; size: number }>;
  onVars(): Promise<string[]>;
  onFinal(result: string): void;
  onSubCall(
    prompt: string,
    opts?: { model?: string }
  ): Promise<string>;
}

/**
 * Validate a filename to prevent path traversal attacks
 * @param filename User-provided filename
 * @throws Error if filename contains path separators or special sequences
 */
function validateFilename(filename: string): void {
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw new Error("Invalid filename: path separators not allowed");
  }
  if (filename.trim().length === 0) {
    throw new Error("Invalid filename: cannot be empty");
  }
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  success: boolean;
  finalResult?: string;
}

export interface ExecutionOptions {
  cwd: string;
  env?: Record<string, string>;
  timeout?: number; // milliseconds
}

/**
 * Execute a JavaScript file using Node.js
 */
export async function executeJavaScript(
  filepath: string,
  options: ExecutionOptions
): Promise<ExecutionResult> {
  return executeCommand("node", [filepath], options);
}

/**
 * Execute a TypeScript file using tsx
 */
export async function executeTypeScript(
  filepath: string,
  options: ExecutionOptions
): Promise<ExecutionResult> {
  // tsx is a fast TypeScript execution engine
  return executeCommand("npx", ["tsx", filepath], options);
}

/**
 * Install pnpm dependencies in a directory
 */
export async function installDependencies(
  options: ExecutionOptions
): Promise<ExecutionResult> {
  return executeCommand("pnpm", ["install"], options);
}

/**
 * Generic command execution helper
 */
async function executeCommand(
  command: string,
  args: string[],
  options: ExecutionOptions
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const timeout = options.timeout || 30000; // 30 seconds default
    let stdout = "";
    let stderr = "";
    let exitCode: number | null = null;
    let timedOut = false;

    const child: ChildProcess = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      // shell: false (default) - Removed shell: true to prevent command injection
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      stderr += `\nExecution timed out after ${timeout}ms`;
    }, timeout);

    // Capture stdout
    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    // Capture stderr
    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // Handle exit
    child.on("exit", (code: number | null) => {
      clearTimeout(timeoutId);
      exitCode = code;
    });

    // Handle close (fired after exit)
    child.on("close", () => {
      resolve({
        stdout,
        stderr,
        exitCode: timedOut ? -1 : exitCode,
        success: !timedOut && exitCode === 0,
      });
    });

    // Handle errors
    child.on("error", (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr: stderr + `\nError: ${error.message}`,
        exitCode: -1,
        success: false,
      });
    });
  });
}

/**
 * Execute a code cell by language
 */
export async function executeCodeCell(
  filename: string,
  language: CodeLanguage,
  options: ExecutionOptions
): Promise<ExecutionResult> {
  const filepath = path.join(options.cwd, "src", filename);

  // Check if file exists
  try {
    await fs.access(filepath);
  } catch (error) {
    return {
      stdout: "",
      stderr: `Error: File not found: ${filepath}`,
      exitCode: -1,
      success: false,
    };
  }

  // Execute based on language
  if (language === "javascript") {
    return executeJavaScript(filepath, options);
  } else {
    return executeTypeScript(filepath, options);
  }
}

/**
 * Write a code cell to disk
 */
export async function writeCodeCellToDisk(
  notebookDir: string,
  filename: string,
  source: string
): Promise<void> {
  // Validate filename to prevent path traversal
  validateFilename(filename);

  const srcDir = path.join(notebookDir, "src");
  await fs.mkdir(srcDir, { recursive: true });
  const filepath = path.join(srcDir, filename);
  await fs.writeFile(filepath, source, "utf8");
}

/**
 * Build the JavaScript preamble that defines REPL globals.
 * These globals use Node IPC (process.send / process.on)
 * to communicate with the parent process.
 */
export function buildREPLPreamble(): string {
  return `
let __reqCounter = 1;
const __pending = new Map();

process.on('message', (msg) => {
  if (msg.type === 'response' && __pending.has(msg.reqId)) {
    const { resolve, reject } = __pending.get(msg.reqId);
    __pending.delete(msg.reqId);
    if (msg.error) {
      reject(new Error(msg.error));
    } else {
      resolve(msg.result);
    }
  }
});

function __ipcRequest(msg) {
  return new Promise((resolve, reject) => {
    const reqId = __reqCounter++;
    msg.reqId = reqId;
    __pending.set(reqId, { resolve, reject });
    process.send(msg);
  });
}

globalThis.store = async function store(name, value) {
  await __ipcRequest({ type: 'store', name, value: String(value) });
};

globalThis.peek = async function peek(name, start, end) {
  return __ipcRequest({ type: 'peek', name, start, end });
};

globalThis.vars = async function vars() {
  return __ipcRequest({ type: 'vars' });
};

globalThis.FINAL = function FINAL(result) {
  process.send({ type: 'final', reqId: 0, value: String(result) });
};

globalThis.FINAL_VAR = async function FINAL_VAR(varName) {
  const val = await globalThis.peek(varName);
  globalThis.FINAL(val.value);
};

globalThis.print = function print(...args) {
  console.log(args.join(' '));
};

globalThis.sub_call = async function sub_call(prompt, opts) {
  return __ipcRequest({
    type: 'sub_call',
    prompt,
    ...(opts || {}),
  });
};

globalThis.llm_query = globalThis.sub_call;
`;
}

const REPL_TIMEOUT_MS = 60_000;

/**
 * Execute a code cell file with REPL globals injected via IPC.
 */
export async function executeWithREPL(
  filepath: string,
  options: ExecutionOptions,
  handler: REPLHandler
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const timeout = options.timeout ?? REPL_TIMEOUT_MS;
    let stdout = "";
    let stderr = "";
    let exitCode: number | null = null;
    let timedOut = false;

    const preamble = buildREPLPreamble();
    const importPath = filepath.replace(/\\/g, "/");
    const script =
      `${preamble}\n` +
      `await import("file://${importPath}");\n` +
      `process.disconnect();\n`;

    const child: ChildProcess = spawn(
      "node",
      ["--input-type=module", "-e", script],
      {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      }
    );

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      stderr += `\nExecution timed out after ${timeout}ms`;
    }, timeout);

    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("message", async (msg: REPLMessage) => {
      try {
        switch (msg.type) {
          case "store": {
            await handler.onStore(msg.name!, msg.value!);
            child.send({
              type: "response",
              reqId: msg.reqId,
              result: true,
            });
            break;
          }
          case "peek": {
            const result = await handler.onPeek(
              msg.name!,
              msg.start,
              msg.end
            );
            child.send({
              type: "response",
              reqId: msg.reqId,
              result,
            });
            break;
          }
          case "vars": {
            const names = await handler.onVars();
            child.send({
              type: "response",
              reqId: msg.reqId,
              result: names,
            });
            break;
          }
          case "final": {
            handler.onFinal(msg.value!);
            break;
          }
          case "sub_call": {
            const text = await handler.onSubCall(
              msg.prompt!,
              msg.value
                ? JSON.parse(msg.value)
                : undefined
            );
            child.send({
              type: "response",
              reqId: msg.reqId,
              result: text,
            });
            break;
          }
          default: {
            child.send({
              type: "response",
              reqId: msg.reqId,
              error:
                `Unsupported REPL message type: ${msg.type}`,
            });
          }
        }
      } catch (err) {
        child.send({
          type: "response",
          reqId: msg.reqId,
          error:
            err instanceof Error
              ? err.message
              : String(err),
        });
      }
    });

    child.on("exit", (code: number | null) => {
      clearTimeout(timeoutId);
      exitCode = code;
    });

    child.on("close", () => {
      resolve({
        stdout,
        stderr,
        exitCode: timedOut ? -1 : exitCode,
        success: !timedOut && exitCode === 0,
      });
    });

    child.on("error", (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr: stderr + `\nError: ${error.message}`,
        exitCode: -1,
        success: false,
      });
    });
  });
}

/**
 * Write package.json to disk
 */
export async function writePackageJsonToDisk(
  notebookDir: string,
  source: string
): Promise<void> {
  const filepath = path.join(notebookDir, "package.json");
  await fs.writeFile(filepath, source, "utf8");
}

/**
 * Write tsconfig.json to disk
 */
export async function writeTsconfigToDisk(
  notebookDir: string,
  source: string
): Promise<void> {
  const filepath = path.join(notebookDir, "tsconfig.json");
  await fs.writeFile(filepath, source, "utf8");
}
