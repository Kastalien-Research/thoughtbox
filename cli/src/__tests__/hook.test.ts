import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const hookPath = join(__dirname, "..", "hooks", "post-tool-use.js");

function runHook(
  stdin: string,
  env: Record<string, string> = {},
): { status: number; stderr: string } {
  const mergedEnv = { ...process.env, ...env };
  try {
    execSync(`node ${hookPath}`, {
      input: stdin,
      env: mergedEnv,
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { status: 0, stderr: "" };
  } catch (error: unknown) {
    const e = error as {
      status?: number;
      stderr?: Buffer;
    };
    return {
      status: e.status ?? 1,
      stderr: e.stderr?.toString() ?? "",
    };
  }
}

describe("PostToolUse hook", () => {
  it("exits silently when no API key is set", () => {
    const result = runHook(
      JSON.stringify({
        tool_name: "Read",
        tool_input: { file_path: "/tmp/test.ts" },
        tool_response: "file contents",
      }),
      { THOUGHTBOX_API_KEY: "", THOUGHTBOX_URL: "" },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("does not crash on Read tool event", () => {
    const result = runHook(
      JSON.stringify({
        tool_name: "Read",
        tool_input: { file_path: "/src/index.ts" },
        tool_response: "export default {};",
      }),
      {
        THOUGHTBOX_API_KEY: "test-key",
        THOUGHTBOX_URL: "http://localhost:9999",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("does not crash on Edit tool event", () => {
    const result = runHook(
      JSON.stringify({
        tool_name: "Edit",
        tool_input: {
          file_path: "/src/index.ts",
          old_string: "foo",
          new_string: "bar",
        },
        tool_response: "ok",
      }),
      {
        THOUGHTBOX_API_KEY: "test-key",
        THOUGHTBOX_URL: "http://localhost:9999",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("does not crash on Bash tool event", () => {
    const result = runHook(
      JSON.stringify({
        tool_name: "Bash",
        tool_input: { command: "echo hello" },
        tool_response: "hello\n",
      }),
      {
        THOUGHTBOX_API_KEY: "test-key",
        THOUGHTBOX_URL: "http://localhost:9999",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("handles malformed JSON without crashing", () => {
    const result = runHook(
      "this is not json {{{",
      {
        THOUGHTBOX_API_KEY: "test-key",
        THOUGHTBOX_URL: "http://localhost:9999",
      },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });
});
