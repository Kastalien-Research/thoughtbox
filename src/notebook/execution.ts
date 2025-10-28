import { spawn, ChildProcess } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { CodeLanguage } from "./types.js";

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
 * Install npm dependencies in a directory
 */
export async function installDependencies(
  options: ExecutionOptions
): Promise<ExecutionResult> {
  return executeCommand("npm", ["install"], options);
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
