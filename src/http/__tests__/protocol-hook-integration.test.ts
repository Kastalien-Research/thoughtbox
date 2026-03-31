import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const HOOK_PATH = path.resolve(
  process.cwd(),
  ".claude/hooks/pre_tool_use.sh",
);

function buildHookInput(
  toolName: string,
  toolInput: Record<string, unknown>,
): string {
  return JSON.stringify({
    tool_name: toolName,
    tool_input: toolInput,
    tool_response: {},
  });
}

describe("pre_tool_use protocol enforcement", () => {
  let projectDir: string;
  let fakeBinDir: string;
  let curlCapturePath: string;

  beforeEach(() => {
    projectDir = mkdtempSync(path.join(os.tmpdir(), "thoughtbox-hook-"));
    fakeBinDir = path.join(projectDir, "bin");
    curlCapturePath = path.join(projectDir, "curl-payload.json");

    mkdirSync(path.join(projectDir, "src"), { recursive: true });
    mkdirSync(fakeBinDir, { recursive: true });

    const fakeCurlPath = path.join(fakeBinDir, "curl");
    writeFileSync(
      fakeCurlPath,
      `#!/usr/bin/env bash
set -euo pipefail
payload=""
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -d)
      payload="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done
if [[ -n "\${FAKE_CURL_CAPTURE:-}" && -n "$payload" ]]; then
  printf '%s' "$payload" > "$FAKE_CURL_CAPTURE"
fi
printf '%s' "$FAKE_CURL_RESPONSE"
exit "$FAKE_CURL_EXIT_CODE"
`,
      "utf8",
    );
    chmodSync(fakeCurlPath, 0o755);
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  function runHook(
    input: string,
    env: Record<string, string> = {},
  ) {
    return spawnSync("bash", [HOOK_PATH], {
      input,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ""}`,
        CLAUDE_PROJECT_DIR: projectDir,
        THOUGHTBOX_PROTOCOL_ENFORCEMENT_URL:
          "http://localhost:1731/protocol/enforcement",
        CC_DISABLE_READ_GUARD: "1",
        FAKE_CURL_CAPTURE: curlCapturePath,
        FAKE_CURL_RESPONSE: JSON.stringify({ enforce: false }),
        FAKE_CURL_EXIT_CODE: "0",
        ...env,
      },
    });
  }

  function capturedPayload(): Record<string, unknown> {
    return JSON.parse(readFileSync(curlCapturePath, "utf8"));
  }

  it("blocks mutating work when Ulysses requires reflect", () => {
    const result = runHook(
      buildHookInput("Bash", { command: "npm test" }),
      {
        FAKE_CURL_RESPONSE: JSON.stringify({
          enforce: true,
          blocked: true,
          protocol: "ulysses",
          reason:
            "REFLECT REQUIRED: Ulysses session is waiting for reflect before further mutation",
          required_action: "reflect",
        }),
      },
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("REFLECT REQUIRED");
    expect(result.stderr).toContain("Required action: reflect");
    expect(capturedPayload()).toEqual({
      mutation: true,
      targetPath: null,
      workspaceId: path.basename(projectDir),
    });
  });

  it("allows read-only inspection while Ulysses is blocked", () => {
    const result = runHook(
      buildHookInput("Bash", { command: "git status --short" }),
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(() => capturedPayload()).toThrow();
  });

  it("blocks Theseus test-file writes", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "widget.test.ts"),
      }),
      {
        FAKE_CURL_RESPONSE: JSON.stringify({
          enforce: true,
          blocked: true,
          protocol: "theseus",
          reason: "TEST LOCK: Cannot modify test files during refactoring",
        }),
      },
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("TEST LOCK");
    expect(capturedPayload()).toEqual({
      mutation: true,
      targetPath: "src/widget.test.ts",
      workspaceId: path.basename(projectDir),
    });
  });

  it("blocks out-of-scope writes until a visa exists", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "other.ts"),
      }),
      {
        FAKE_CURL_RESPONSE: JSON.stringify({
          enforce: true,
          blocked: true,
          protocol: "theseus",
          reason: "VISA REQUIRED: File outside declared scope",
          required_action: "visa",
        }),
      },
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("VISA REQUIRED");
    expect(result.stderr).toContain("Required action: visa");
  });

  it("allows in-scope Theseus writes", () => {
    const result = runHook(
      buildHookInput("Write", {
        file_path: path.join(projectDir, "src", "in-scope.ts"),
      }),
      {
        FAKE_CURL_RESPONSE: JSON.stringify({
          enforce: true,
          blocked: false,
          protocol: "theseus",
        }),
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(capturedPayload()).toEqual({
      mutation: true,
      targetPath: "src/in-scope.ts",
      workspaceId: path.basename(projectDir),
    });
  });
});
