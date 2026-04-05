import { describe, it, expect } from "vitest";
import { mergeThoughtboxHook } from "../settings.js";

describe("mergeThoughtboxHook", () => {
  const hookPath =
    'node "$CLAUDE_PROJECT_DIR/.claude/hooks/thoughtbox-post-tool-use.js"';
  const apiKey = "test-api-key";
  const serverUrl = "https://mcp.kastalienresearch.ai";

  it("creates hooks section when settings is empty", () => {
    const result = mergeThoughtboxHook(
      {},
      hookPath,
      apiKey,
      serverUrl,
    );

    expect(result["hooks"]).toBeDefined();
    const hooks = result["hooks"] as Record<string, unknown>;
    const postToolUse = hooks["PostToolUse"] as Array<{
      matcher: string;
      hooks: Array<{ type: string; command: string }>;
    }>;
    expect(postToolUse).toHaveLength(1);
    expect(postToolUse[0]?.matcher).toBe("");
    expect(postToolUse[0]?.hooks[0]?.command).toBe(hookPath);
  });

  it("appends to existing hooks without overwriting", () => {
    const existing = {
      hooks: {
        PostToolUse: [
          {
            matcher: "*.ts",
            hooks: [
              { type: "command", command: "echo existing" },
            ],
          },
        ],
      },
    };

    const result = mergeThoughtboxHook(
      existing,
      hookPath,
      apiKey,
      serverUrl,
    );

    const hooks = result["hooks"] as Record<string, unknown>;
    const postToolUse = hooks["PostToolUse"] as Array<{
      matcher: string;
      hooks: Array<{ type: string; command: string }>;
    }>;
    expect(postToolUse).toHaveLength(2);
    expect(postToolUse[0]?.hooks[0]?.command).toBe(
      "echo existing",
    );
    expect(postToolUse[1]?.hooks[0]?.command).toBe(hookPath);
  });

  it("updates existing Thoughtbox hook in place", () => {
    const existing = {
      hooks: {
        PostToolUse: [
          {
            matcher: "*.ts",
            hooks: [
              { type: "command", command: "echo other" },
            ],
          },
          {
            matcher: "",
            hooks: [
              {
                type: "command",
                command: "node old-thoughtbox-hook.js",
              },
            ],
          },
        ],
      },
    };

    const result = mergeThoughtboxHook(
      existing,
      hookPath,
      apiKey,
      serverUrl,
    );

    const hooks = result["hooks"] as Record<string, unknown>;
    const postToolUse = hooks["PostToolUse"] as Array<{
      matcher: string;
      hooks: Array<{ type: string; command: string }>;
    }>;
    expect(postToolUse).toHaveLength(2);
    expect(postToolUse[0]?.hooks[0]?.command).toBe(
      "echo other",
    );
    expect(postToolUse[1]?.hooks[0]?.command).toBe(hookPath);
  });

  it("adds env vars for API key and URL", () => {
    const result = mergeThoughtboxHook(
      {},
      hookPath,
      apiKey,
      serverUrl,
    );

    const env = result["env"] as Record<string, string>;
    expect(env["THOUGHTBOX_API_KEY"]).toBe(apiKey);
    expect(env["THOUGHTBOX_URL"]).toBe(serverUrl);
  });

  it("preserves existing env vars", () => {
    const existing = {
      env: { EXISTING_VAR: "keep-me" },
    };

    const result = mergeThoughtboxHook(
      existing,
      hookPath,
      apiKey,
      serverUrl,
    );

    const env = result["env"] as Record<string, string>;
    expect(env["EXISTING_VAR"]).toBe("keep-me");
    expect(env["THOUGHTBOX_API_KEY"]).toBe(apiKey);
    expect(env["THOUGHTBOX_URL"]).toBe(serverUrl);
  });
});
