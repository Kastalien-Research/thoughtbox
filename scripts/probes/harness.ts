/**
 * Thoughtbox Probe Harness
 *
 * A minimal scaffold for spawning a Claude Agent SDK agent wired to the live
 * Code Mode Thoughtbox MCP server, so individual probes can be written ad hoc.
 *
 * Write a probe as a standalone file that imports `runProbe` from here:
 *
 *   import { runProbe } from "./harness.js";
 *   const r = await runProbe({ name: "my-probe", prompt: "..." });
 *
 * Run it with: npx tsx scripts/probes/<name>.probe.ts
 *
 * Connection: the harness drives the repo's approved `thoughtbox-cloud-run`
 * MCP server, defined and approved in `.mcp.json`. A programmatically-passed
 * http MCP server is left `disabled` by the headless Agent SDK CLI (no
 * approval path in non-interactive mode), so the harness relies on the
 * project's already-trusted connection. Probes must therefore run from the
 * repo root, where the CLI auto-loads `.mcp.json`.
 */

import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { query } from "@anthropic-ai/claude-agent-sdk";

config();

/**
 * The Agent SDK spawns the Claude Code CLI, which inherits this process's env.
 * This repo's `.env`/ambient session enable OpenTelemetry export aimed at a
 * local collector that no longer exists, and set `OTEL_*_EXPORTER=otlp`
 * without a valid `OTEL_EXPORTER_OTLP_PROTOCOL`. The child CLI then crashes
 * during telemetry init ("Unknown protocol ... undefined"). Probes don't need
 * Claude Code's own telemetry, so strip those vars from the child's env.
 */
for (const key of [
  "CLAUDE_CODE_ENABLE_TELEMETRY",
  "OTEL_METRICS_EXPORTER",
  "OTEL_LOGS_EXPORTER",
  "OTEL_TRACES_EXPORTER",
  "OTEL_EXPORTER_OTLP_PROTOCOL",
  "OTEL_EXPORTER_OTLP_METRICS_PROTOCOL",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
]) {
  delete process.env[key];
}

const MCP_SERVER_NAME = "thoughtbox-cloud-run";

/** The three Code Mode tools the live `/mcp` surface exposes. */
export const THOUGHTBOX_TOOLS = [
  `mcp__${MCP_SERVER_NAME}__thoughtbox_search`,
  `mcp__${MCP_SERVER_NAME}__thoughtbox_execute`,
  `mcp__${MCP_SERVER_NAME}__thoughtbox_peer_notebook`,
];

export interface ProbeOptions {
  /** Short identifier for the probe, used in logs and result files. */
  name: string;
  /** The natural-language task handed to the agent. */
  prompt: string;
  /** Extra tools to allow beyond the Thoughtbox set (e.g. "Read"). */
  allowedTools?: string[];
  /** Hard cap on agent turns so a confused agent can't loop forever. */
  maxTurns?: number;
  /** Model override; defaults to the SDK/session default. */
  model?: string;
  /** Optional pass/fail check. Throw to fail; return to pass. */
  assert?: (result: ProbeResult) => void | Promise<void>;
}

export interface ToolCallRecord {
  tool: string;
  /** Compact preview of the tool input (truncated). */
  inputPreview: string;
}

export interface ProbeResult {
  name: string;
  /** Whether the agent run reached a successful result. */
  completed: boolean;
  /** The agent's final assistant text. */
  finalText: string;
  /** `tb.*` SDK operations the agent invoked, parsed from execute calls. */
  tbOperations: string[];
  /** Every tool call the agent made, for inspection. */
  toolCalls: ToolCallRecord[];
  turns: number;
  usage: { inputTokens?: number; outputTokens?: number; totalCostUsd?: number };
  /** Set only when `assert` was provided. */
  passed?: boolean;
  /** Populated when the run errored or an assertion failed. */
  error?: string;
}

/**
 * Fail fast if the approved Thoughtbox MCP server isn't configured in the
 * project's `.mcp.json`. Surfaces a clear, actionable error instead of a
 * confused agent that silently lacks its tools.
 */
export function assertThoughtboxAvailable(): void {
  let raw: string;
  try {
    raw = readFileSync(".mcp.json", "utf-8");
  } catch {
    throw new Error(
      "No .mcp.json in the current directory. Run probes from the repo root, " +
        `where the '${MCP_SERVER_NAME}' MCP server is defined.`,
    );
  }
  const servers = (JSON.parse(raw) as { mcpServers?: Record<string, unknown> }).mcpServers ?? {};
  if (!servers[MCP_SERVER_NAME]) {
    throw new Error(
      `.mcp.json does not define the '${MCP_SERVER_NAME}' MCP server, so the ` +
        "agent will have no Thoughtbox tools.",
    );
  }
}

/** Parse `tb.<op>(` occurrences out of a Code Mode execute payload. */
function parseTbOperations(input: unknown, into: Set<string>): void {
  const text = typeof input === "string" ? input : JSON.stringify(input ?? "");
  for (const match of text.matchAll(/\btb\.(\w+)\b/g)) {
    into.add(match[1]);
  }
}

/** Drain one SDK message into the accumulating result. */
function ingestMessage(
  message: any,
  acc: { text: string; toolCalls: ToolCallRecord[]; tbOps: Set<string> },
): void {
  if (message.type === "assistant" && message.message?.content) {
    for (const block of message.message.content) {
      if ("text" in block) {
        acc.text += block.text + "\n";
      } else if ("name" in block) {
        const input = (block as { input?: unknown }).input;
        const preview = JSON.stringify(input ?? {}).slice(0, 200);
        acc.toolCalls.push({ tool: block.name, inputPreview: preview });
        if (String(block.name).includes("thoughtbox_execute")) {
          parseTbOperations(input, acc.tbOps);
        }
      }
    }
  }
}

/**
 * Spawn an agent wired to Thoughtbox, run the prompt unattended, and return a
 * structured result. The agent is scoped to the Thoughtbox tools (plus
 * `ToolSearch`, needed to load the deferred MCP tools, and any `allowedTools`
 * extras) and bounded by `maxTurns`.
 */
export async function runProbe(opts: ProbeOptions): Promise<ProbeResult> {
  assertThoughtboxAvailable();

  const acc = { text: "", toolCalls: [] as ToolCallRecord[], tbOps: new Set<string>() };
  const result: ProbeResult = {
    name: opts.name,
    completed: false,
    finalText: "",
    tbOperations: [],
    toolCalls: acc.toolCalls,
    turns: 0,
    usage: {},
  };

  try {
    for await (const message of query({
      prompt: opts.prompt,
      options: {
        // No `mcpServers` / `strictMcpConfig`: rely on the CLI auto-loading the
        // approved `thoughtbox-cloud-run` server from the repo's `.mcp.json`.
        allowedTools: ["ToolSearch", ...THOUGHTBOX_TOOLS, ...(opts.allowedTools ?? [])],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        maxTurns: opts.maxTurns ?? 20,
        ...(opts.model ? { model: opts.model } : {}),
      },
    })) {
      ingestMessage(message, acc);
      if (message.type === "result") {
        result.completed = message.subtype === "success";
        result.turns = message.num_turns ?? 0;
        result.usage = {
          inputTokens: message.usage?.input_tokens,
          outputTokens: message.usage?.output_tokens,
          totalCostUsd: message.total_cost_usd,
        };
        if (!result.completed) result.error = `agent ended with: ${message.subtype}`;
      }
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  result.finalText = acc.text.trim();
  result.tbOperations = [...acc.tbOps];

  if (opts.assert) {
    try {
      await opts.assert(result);
      result.passed = true;
    } catch (err) {
      result.passed = false;
      result.error = err instanceof Error ? err.message : String(err);
    }
  }

  return result;
}

/** Print a one-screen summary of a probe result to the console. */
export function reportProbe(result: ProbeResult): void {
  const status = result.passed === undefined
    ? (result.completed ? "DONE" : "INCOMPLETE")
    : (result.passed ? "PASS" : "FAIL");
  console.log(`\n── probe: ${result.name} [${status}] ──`);
  console.log(`turns: ${result.turns}  cost: $${result.usage.totalCostUsd ?? "n/a"}`);
  console.log(`tb operations: ${result.tbOperations.join(", ") || "(none)"}`);
  console.log(`tool calls: ${result.toolCalls.map((t) => t.tool).join(", ") || "(none)"}`);
  if (result.error) console.log(`error: ${result.error}`);
  console.log(`\n${result.finalText}\n`);
}
