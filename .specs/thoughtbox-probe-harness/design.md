# Thoughtbox Probe Harness — Design

**Date:** 2026-05-31
**Status:** Draft (brainstormed, pending implementation plan)
**Branch:** `feat/thoughtbox-probe-harness`

## Purpose

A minimal, reusable TypeScript scaffold for spawning a Claude Agent SDK agent
wired to the live Thoughtbox MCP server, so that individual behavioral/exploratory
**probes** can be written ad hoc against it. Infrastructure first; specific test
suites and value-evals layer on later.

## Goals

- One small module that handles the boilerplate: connect an SDK agent to
  Thoughtbox over MCP, allowlist its tools, run a natural-language task, and
  return a structured result.
- Writing a new probe is a few lines in a standalone file run with `tsx`.
- Defaults to the live Cloud Run server; switchable to a local instance via env.
- Optional pass/fail assertion per probe, without forcing every probe to be a test.

## Non-goals (YAGNI for now)

- No `vitest` integration. Agent runs are non-deterministic, slow, and costly;
  they do not belong in the deterministic unit-test runner (which the repo
  serializes with `fileParallelism: false` for shared-Supabase tests).
- No value-eval scoring (with/without Thoughtbox comparison). The `assert()` hook
  leaves room for this later without redesign.
- No CI wiring.

## Context — what already exists

- `scripts/agentic-test.ts` already uses `@anthropic-ai/claude-agent-sdk` to spawn
  an agent with an MCP client wired to Thoughtbox and run NL behavioral tests.
  **It is stale:** its embedded spec targets the removed `thoughtbox_gateway`
  single-tool surface (`operation` + `args`). The live contract is Code Mode:
  `thoughtbox_search` + `thoughtbox_execute` (+ `thoughtbox_peer_notebook`).
- `.claude/skills/test-suite/` is the *current* behavioral contract (45 tests across
  the 2-tool Code Mode surface) but is a **skill an agent follows interactively**,
  not a runnable SDK script.
- `scripts/agents/*` is a fleet of SDK worker agents on a shared `agent-harness.ts`
  (`query()` wrapper). They perform work; they do not test Thoughtbox.

This harness fills the gap: a runnable SDK scaffold targeting the **current** Code
Mode surface. The stale `agentic-test.ts` should be mined for its connection code
and then removed (tracked as a follow-up; relates to the repo cleanup effort).

## Dependencies

- `@anthropic-ai/claude-agent-sdk` — **bumped `^0.1.76` → `0.3.159`** (pinned).
  The 0.1.x bundled CLI (Claude Code 2.0.77, Jan 2026) crashed on startup in
  this repo (see Findings) and is five months stale. The bump is repo-wide; the
  fleet (`scripts/agents/*`) uses only the stable `query()` core API, which is
  unchanged. Peer-dep warnings remain (`zod@4`, `@anthropic-ai/sdk@>=0.93`) —
  see Follow-ups.
- `dotenv` — already present.

## Connection & configuration

> **Design change (validated against the live SDK).** The original plan passed
> an isolated, env-configured http MCP server to the SDK. In headless runs the
> Agent SDK CLI leaves a programmatically-passed http server **`disabled`** (no
> interactive approval path), so the agent gets no Thoughtbox tools. The harness
> therefore drives the repo's **already-approved `thoughtbox-cloud-run`** server
> from `.mcp.json`, which the current CLI auto-loads. See Findings.

The live server is HTTP MCP at `https://mcp.kastalienresearch.ai/mcp`, authed by a
`tbx_` API key, defined and approved as `thoughtbox-cloud-run` in `.mcp.json`
(gitignored; the key never enters git).

Consequences:
- Probes **must run from the repo root**, where the CLI auto-loads `.mcp.json`.
- A `dotenv` `config()` still loads `.env`, but the harness then **strips the
  repo's OpenTelemetry env vars** from the child CLI's environment (they point at
  a removed local collector and crash telemetry init — see Findings).
- Tool names are `mcp__thoughtbox-cloud-run__*`.
- Local-instance targeting is deferred (would require adding/approving a local
  server entry in `.mcp.json`).

## Findings (from live validation)

1. **Telemetry crash.** The spawned CLI inherits this repo's `OTEL_*_EXPORTER=otlp`
   without a valid `OTEL_EXPORTER_OTLP_PROTOCOL`, throwing
   `Unknown protocol ... undefined` and exiting 1. Fix: strip the OTEL/telemetry
   vars in the harness before spawning.
2. **Disabled isolated server.** A programmatically-passed `mcpServers` http
   entry stays `status: "disabled"` with no connection error — even with
   `strictMcpConfig`, `enableAllProjectMcpServers`, and `enabledMcpjsonServers`
   set. Those flags govern `.mcp.json`/enterprise servers, not SDK-passed ones.
   The approved `.mcp.json` `thoughtbox-cloud-run` connects fine.

## Components

### `scripts/probes/harness.ts`

Exports:

- `assertThoughtboxAvailable(): void`
  Fails fast if `.mcp.json` (in cwd) doesn't define the `thoughtbox-cloud-run`
  server, with an actionable message — instead of a confused agent that silently
  lacks its tools.

- `runProbe(opts): Promise<ProbeResult>`
  Wraps the SDK `query()`:
  - Calls `assertThoughtboxAvailable()` first.
  - Does **not** pass `mcpServers`/`strictMcpConfig`; relies on the CLI
    auto-loading the approved `thoughtbox-cloud-run` server from `.mcp.json`.
  - Allowlists `ToolSearch` (needed to load the deferred MCP tools) plus the
    Thoughtbox tools (`mcp__thoughtbox-cloud-run__thoughtbox_{search,execute,peer_notebook}`)
    and any `allowedTools` extras, and runs in `bypassPermissions` so it's
    unattended.
  - Streams the agent turns, capturing assistant text and tool-call events.
  - Enforces `maxTurns` so a confused agent cannot loop forever.
  - Optionally runs `assert(result)` for pass/fail probes.

  ```ts
  interface ProbeOptions {
    name: string;
    prompt: string;            // the natural-language task for the agent
    allowedTools?: string[];   // extra tools beyond the Thoughtbox set
    maxTurns?: number;         // default e.g. 20
    model?: string;            // default: session/SDK default
    assert?: (r: ProbeResult) => void | Promise<void>; // throws on failure
  }

  interface ProbeResult {
    name: string;
    finalText: string;             // agent's final message
    tbOperations: string[];        // tb.* ops the agent actually invoked
    toolCalls: ToolCallRecord[];   // raw tool-call events for inspection
    turns: number;
    usage: { inputTokens; outputTokens; totalCostUsd? };
    passed?: boolean;              // set when assert() was provided
  }
  ```

### `scripts/probes/*.probe.ts`

Each probe is a standalone file importing the harness, calling `runProbe`, and
printing the result. Run with `tsx scripts/probes/<name>.probe.ts`.

### `scripts/probes/monitor.ts`

Live tail of Thoughtbox writes (sessions + thoughts) straight from Supabase, so
the agent's output is visible while a probe runs. Connects with
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` from `.env` (the project the live
server writes to — `akjccuoncxlvrrtkvtno`, confirmed via the round-trip session),
polls every `--interval` seconds, and prints new `sessions`/`thoughts` rows.
Flags: `--since <min>` (backfill), `--once` (single snapshot), `--interval <sec>`.
Typical use: run it in one terminal, a probe in another.

### Result persistence (optional)

`runProbe` may write `ProbeResult` to `scripts/probes/runs/<name>.json` (gitignored)
for later comparison. Off by default; enabled by a flag/env.

## Data flow

```
probe file → runProbe(opts) → SDK query() agent ⇄ Thoughtbox MCP (live HTTP)
                                   │
                                   └─→ ProbeResult → console (+ optional runs/*.json)
```

Every probe spawns a real agent against real models and writes real data to
Supabase — runs appear in the web app's Runs view.

## Seed probes (prove the harness)

1. `surface.probe.ts` — agent lists available tools and confirms the Code Mode
   2-tool surface (`thoughtbox_search`, `thoughtbox_execute`). `assert`: the two
   tools are present and legacy raw tools are absent.
2. `thought-roundtrip.probe.ts` — agent records a thought via `thoughtbox_execute`,
   then retrieves it. `assert`: the recorded thought is returned on retrieval
   (verifies real Supabase persistence).

## File layout

```
scripts/probes/
  harness.ts            # connection + runProbe
  monitor.ts            # live Supabase tail of sessions/thoughts
  surface.probe.ts      # seed probe 1
  thought-roundtrip.probe.ts  # seed probe 2
  runs/                 # gitignored probe-result output
  README.md             # how to add a probe, env setup
```

## Error handling

- Missing `THOUGHTBOX_API_KEY` (or `THOUGHTBOX_URL` when overriding) → fail fast
  with an actionable message naming the env var and where to set it.
- MCP connection/handshake failure → surface the SDK error verbatim; do not swallow.
- `maxTurns` exceeded → return a `ProbeResult` flagged as not-completed rather than
  hanging.
- `assert()` throw → caught, recorded as `passed: false` with the error, run still
  returns a result.

## Cost

Each probe is a real agent run against real models plus real Supabase writes.
Per the Agent SDK docs, from June 15 2026 SDK/`-p` usage on subscription plans
draws on a separate monthly Agent SDK credit. Probes should be run deliberately,
not in tight loops, and `maxTurns` bounds per-probe spend.

## Follow-ups (out of scope here, track separately)

- **Verify the agent fleet under the bumped SDK.** `@anthropic-ai/claude-agent-sdk@0.3.159`
  has unmet peer deps in this repo (`zod@4`, `@anthropic-ai/sdk@>=0.93`; repo has
  zod 3 / sdk 0.39). `query()` is API-stable and `tsc` passes, but the
  `scripts/agents/*` fleet should be smoke-run to confirm no runtime regression.
- Remove/replace the stale `scripts/agentic-test.ts` (relates to repo cleanup).
- Restore isolated/portable connection if the SDK gains a headless approval path
  for programmatically-passed MCP servers (would re-enable local-instance and
  out-of-repo use).
- Optional: a `run-all` that globs `*.probe.ts` once there are enough probes.
- Optional later modes: behavioral suite (assert-heavy) and value-evals
  (with/without Thoughtbox comparison), layered on the same `assert()` seam.
