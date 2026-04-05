#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTypeScriptProject } from "./parser.js";
import type { ProjectModel } from "./parser.js";
import { mergeThoughtboxHook } from "./settings.js";

const DEFAULT_SERVER_URL =
  "https://mcp.kastalienresearch.ai";

interface CliArgs {
  command: string;
  apiKey: string;
  serverUrl: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const command = args[0];

  if (command !== "init") {
    console.error(
      "Usage: npx thoughtbox init --key <api_key> [--url <server_url>]",
    );
    process.exit(1);
  }

  let apiKey = "";
  let serverUrl = DEFAULT_SERVER_URL;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--key" && args[i + 1]) {
      apiKey = args[i + 1] as string;
      i++;
    } else if (args[i] === "--url" && args[i + 1]) {
      serverUrl = args[i + 1] as string;
      i++;
    }
  }

  if (!apiKey) {
    console.error("Error: --key <api_key> is required");
    console.error(
      "Usage: npx thoughtbox init --key <api_key> [--url <server_url>]",
    );
    process.exit(1);
  }

  return { command, apiKey, serverUrl };
}

async function validateApiKey(
  serverUrl: string,
  apiKey: string,
): Promise<void> {
  const url = `${serverUrl}/health`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : String(err);
    console.error(
      `Failed to connect to ${url}: ${msg}`,
    );
    process.exit(1);
  }

  if (!response.ok) {
    console.error(
      `API key validation failed: ${response.status} ${response.statusText}`,
    );
    process.exit(1);
  }
}

function copyHookScript(projectDir: string): string {
  const claudeHooksDir = path.join(
    projectDir,
    ".claude",
    "hooks",
  );
  fs.mkdirSync(claudeHooksDir, { recursive: true });

  const thisFile = fileURLToPath(import.meta.url);
  const thisDir = path.dirname(thisFile);
  const sourceHook = path.join(
    thisDir,
    "hooks",
    "post-tool-use.js",
  );

  if (!fs.existsSync(sourceHook)) {
    console.error(
      `Hook script not found at ${sourceHook}`,
    );
    process.exit(1);
  }

  const destHook = path.join(
    claudeHooksDir,
    "thoughtbox-post-tool-use.js",
  );
  fs.copyFileSync(sourceHook, destHook);
  return destHook;
}

function mergeSettings(
  projectDir: string,
  hookScriptPath: string,
  apiKey: string,
  serverUrl: string,
): void {
  const settingsPath = path.join(
    projectDir,
    ".claude",
    "settings.json",
  );
  const claudeDir = path.join(projectDir, ".claude");
  fs.mkdirSync(claudeDir, { recursive: true });

  let existing: Record<string, unknown> = {};
  if (fs.existsSync(settingsPath)) {
    const raw = fs.readFileSync(settingsPath, "utf-8");
    existing = JSON.parse(raw) as Record<string, unknown>;
  }

  const hookCommand = `node "${hookScriptPath}"`;
  const merged = mergeThoughtboxHook(
    existing,
    hookCommand,
    apiKey,
    serverUrl,
  );

  fs.writeFileSync(
    settingsPath,
    JSON.stringify(merged, null, 2) + "\n",
  );
}

function checkGitignore(projectDir: string): void {
  const gitignorePath = path.join(
    projectDir,
    ".gitignore",
  );
  if (!fs.existsSync(gitignorePath)) {
    console.warn(
      "Warning: No .gitignore found. Consider adding .claude/ to .gitignore.",
    );
    return;
  }

  const content = fs.readFileSync(gitignorePath, "utf-8");
  const lines = content.split("\n");
  const hasClaudeIgnore = lines.some(
    (line) =>
      line.trim() === ".claude/" ||
      line.trim() === ".claude",
  );

  if (!hasClaudeIgnore) {
    console.warn(
      "Warning: .claude/ is not in .gitignore. API keys in settings.json may be committed.",
    );
  }
}

interface OtlpLogPayload {
  resourceLogs: Array<{
    resource: {
      attributes: Array<{
        key: string;
        value: { stringValue: string };
      }>;
    };
    scopeLogs: Array<{
      logRecords: Array<{
        timeUnixNano: string;
        severityText: string;
        body: { stringValue: string };
        attributes: Array<{
          key: string;
          value:
            | { stringValue: string }
            | { intValue: string };
        }>;
      }>;
    }>;
  }>;
}

function buildModuleLogPayload(
  mod: { name: string; path: string; fileCount: number; exports: string[] },
): OtlpLogPayload {
  const nowNanos = (
    BigInt(Date.now()) * 1_000_000n
  ).toString();

  return {
    resourceLogs: [
      {
        resource: {
          attributes: [
            {
              key: "session.id",
              value: {
                stringValue: "thoughtbox-init",
              },
            },
          ],
        },
        scopeLogs: [
          {
            logRecords: [
              {
                timeUnixNano: nowNanos,
                severityText: "INFO",
                body: {
                  stringValue: `module:${mod.name}`,
                },
                attributes: [
                  {
                    key: "event.name",
                    value: {
                      stringValue:
                        "thoughtbox.module_registered",
                    },
                  },
                  {
                    key: "module.name",
                    value: {
                      stringValue: mod.name,
                    },
                  },
                  {
                    key: "module.path",
                    value: {
                      stringValue: mod.path,
                    },
                  },
                  {
                    key: "module.file_count",
                    value: {
                      intValue: String(mod.fileCount),
                    },
                  },
                  {
                    key: "module.export_count",
                    value: {
                      intValue: String(
                        mod.exports.length,
                      ),
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

async function uploadModuleGraph(
  model: ProjectModel,
  serverUrl: string,
  apiKey: string,
): Promise<void> {
  const url = `${serverUrl}/v1/logs`;

  for (const mod of model.modules) {
    const payload = buildModuleLogPayload(mod);
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Non-fatal: module upload failures should not
      // block init completion
    }
  }
}

function printSummary(
  model: ProjectModel | null,
  hookConfigured: boolean,
): void {
  console.log("\nThoughtbox initialized successfully!\n");

  if (model) {
    console.log(
      `  Modules found: ${model.modules.length}`,
    );
    console.log(`  Edges found:   ${model.edges.length}`);
  } else {
    console.log(
      "  No TypeScript project detected (hook-only mode)",
    );
  }

  if (hookConfigured) {
    console.log("  Hook configured: PostToolUse");
  }

  console.log(
    "\n  Test: Open Claude Code in this project and use any tool.",
  );
}

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv);
  const cwd = process.cwd();

  console.log("Validating API key...");
  await validateApiKey(
    cliArgs.serverUrl,
    cliArgs.apiKey,
  );
  console.log("API key valid.");

  let model: ProjectModel | null = null;
  const tsconfigPath = path.join(cwd, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    console.log("Parsing TypeScript project...");
    model = parseTypeScriptProject(cwd);
    console.log(
      `Found ${model.modules.length} modules, ${model.edges.length} edges.`,
    );
  } else {
    console.warn(
      "Warning: No tsconfig.json found. Running in hook-only mode.",
    );
  }

  console.log("Installing hook script...");
  const hookPath = copyHookScript(cwd);

  console.log("Configuring .claude/settings.json...");
  mergeSettings(cwd, hookPath, cliArgs.apiKey, cliArgs.serverUrl);

  checkGitignore(cwd);

  if (model) {
    console.log("Uploading module graph...");
    await uploadModuleGraph(
      model,
      cliArgs.serverUrl,
      cliArgs.apiKey,
    );
  }

  printSummary(model, true);
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
