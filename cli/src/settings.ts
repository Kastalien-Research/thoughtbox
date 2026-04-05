import type { HookEntry, Settings } from "./types.js";

export function mergeThoughtboxHook(
  settings: Record<string, unknown>,
  hookScriptPath: string,
  apiKey: string,
  serverUrl: string,
): Record<string, unknown> {
  const result = { ...settings };

  const hooks = (result["hooks"] ?? {}) as Record<
    string,
    unknown
  >;
  const postToolUse = (
    Array.isArray(hooks["PostToolUse"])
      ? [...hooks["PostToolUse"]]
      : []
  ) as HookEntry[];

  const newEntry: HookEntry = {
    matcher: "",
    hooks: [{ type: "command", command: hookScriptPath }],
  };

  const existingIdx = postToolUse.findIndex((entry) =>
    entry.hooks?.some((h) =>
      h.command?.includes("thoughtbox"),
    ),
  );

  if (existingIdx >= 0) {
    postToolUse[existingIdx] = newEntry;
  } else {
    postToolUse.push(newEntry);
  }

  const env = (result["env"] ?? {}) as Record<
    string,
    string
  >;

  return {
    ...result,
    hooks: { ...hooks, PostToolUse: postToolUse },
    env: {
      ...env,
      THOUGHTBOX_API_KEY: apiKey,
      THOUGHTBOX_URL: serverUrl,
    },
  };
}
