# Thoughts-as-Runbook Demo

Demonstrates whether existing Thoughtbox thought types can serve as a runbook
for the scenario: **"Agent refactors an MCP server from Python to TypeScript,
logging intent and progress through Thoughtbox."**

---

## 1. System Instruction for the Demo Agent

Add the following to the agent's system prompt:

> **Runbook Protocol — Record your work through Thoughtbox thoughts.**
>
> Before starting, record your plan as a `reasoning` thought listing all subtasks.
> After each work chunk, record what you did as an `action_report` with `actionResult`
> (success, tool, target, reversible). For key decisions between alternatives, use
> `decision_frame` with `confidence` and `options` (exactly one `selected: true`).
> Use `reasoning` for analysis, synthesis, or when you notice something unexpected.
> When you are done, send a final `reasoning` thought with `nextThoughtNeeded: false`.

---

## 2. Example Session (10 Thoughts)

Each block below shows the exact JSON sent via `thoughtbox_gateway { operation: "thought", args: { ... } }`.

### Thought 1 — Plan (reasoning)

```json
{
  "operation": "thought",
  "args": {
    "thought": "I will refactor the weather-mcp-server from Python to TypeScript. Subtasks: 1) Analyze Python handlers and extract interface contracts, 2) Set up TypeScript project with @modelcontextprotocol/sdk, 3) Convert get_forecast handler, 4) Convert get_alerts handler, 5) Convert get_historical handler, 6) Convert shared types (WeatherData, Location, Alert), 7) Write integration tests, 8) Verify against MCP Inspector.",
    "thoughtType": "reasoning",
    "nextThoughtNeeded": true,
    "sessionTitle": "Refactor weather-mcp-server: Python to TypeScript",
    "sessionTags": ["task:refactor", "lang:python-to-typescript", "project:weather-mcp"]
  }
}
```

### Thought 2 — Project structure decision (decision_frame)

```json
{
  "operation": "thought",
  "args": {
    "thought": "Choosing TypeScript project structure. The Python server is a single module with 3 handlers and a types file. A monorepo adds complexity we do not need for a single MCP server.",
    "thoughtType": "decision_frame",
    "nextThoughtNeeded": true,
    "confidence": "high",
    "options": [
      {
        "label": "Single package with src/ directory",
        "selected": true,
        "reason": "Matches the simplicity of the Python original. One package.json, one tsconfig, one build step."
      },
      {
        "label": "Turborepo monorepo with packages/server and packages/types",
        "selected": false,
        "reason": "Overkill for 3 handlers and a types file. Adds build orchestration overhead."
      }
    ]
  }
}
```

### Thought 3 — Python handler analysis complete (action_report)

```json
{
  "operation": "thought",
  "args": {
    "thought": "Analyzed all 3 Python handlers. get_forecast takes a Location and returns WeatherData with 7 fields. get_alerts takes a region string and returns Alert[]. get_historical takes Location + date range and returns WeatherData[]. All handlers use httpx for API calls and return typed dicts. No dynamic dispatch, no middleware.",
    "thoughtType": "action_report",
    "nextThoughtNeeded": true,
    "actionResult": {
      "success": true,
      "reversible": "yes",
      "tool": "code_analysis",
      "target": "weather_mcp/handlers.py"
    }
  }
}
```

### Thought 4 — TypeScript project set up (action_report)

```json
{
  "operation": "thought",
  "args": {
    "thought": "Created TypeScript project: pnpm init, installed @modelcontextprotocol/sdk@1.12.0, zod@3.24.2, typescript@5.7.3. Created tsconfig.json with strict mode, ESM output. Created src/ with index.ts (server entry), handlers/ directory, and types.ts stub.",
    "thoughtType": "action_report",
    "nextThoughtNeeded": true,
    "actionResult": {
      "success": true,
      "reversible": "yes",
      "tool": "shell",
      "target": "weather-mcp-server-ts/",
      "sideEffects": ["created package.json", "created tsconfig.json", "installed node_modules"]
    }
  }
}
```

### Thought 5 — Converted 3 handlers (action_report)

```json
{
  "operation": "thought",
  "args": {
    "thought": "Converted all 3 handlers to TypeScript. get_forecast: 42 lines, uses zod schema for input validation. get_alerts: 28 lines, returns typed Alert array. get_historical: 51 lines, validates date range before API call. All handlers use native fetch (Node 22) instead of httpx. Registered all 3 as MCP tools via server.tool().",
    "thoughtType": "action_report",
    "nextThoughtNeeded": true,
    "actionResult": {
      "success": true,
      "reversible": "partial",
      "tool": "file_write",
      "target": "src/handlers/",
      "sideEffects": ["created get-forecast.ts", "created get-alerts.ts", "created get-historical.ts"]
    }
  }
}
```

### Thought 6 — Dynamic dispatch observation (reasoning)

```json
{
  "operation": "thought",
  "args": {
    "thought": "While converting types, I noticed the Python server uses a registry dict mapping handler names to functions (HANDLERS = {'get_forecast': get_forecast, ...}). The MCP SDK handles this natively via server.tool() registration, so the registry pattern is unnecessary in TypeScript. The Python dynamic dispatch is replaced by the SDK's built-in tool routing. No additional work needed.",
    "thoughtType": "reasoning",
    "nextThoughtNeeded": true
  }
}
```

### Thought 7 — Type representation decision (decision_frame)

```json
{
  "operation": "thought",
  "args": {
    "thought": "Choosing how to represent the shared types (WeatherData, Location, Alert) in TypeScript. The Python version uses TypedDicts. Need to decide between plain interfaces (simple but no runtime validation) vs. zod schemas that infer types (runtime validation built in, used by MCP SDK already).",
    "thoughtType": "decision_frame",
    "nextThoughtNeeded": true,
    "confidence": "high",
    "options": [
      {
        "label": "Zod schemas with inferred types",
        "selected": true,
        "reason": "Already using zod for handler input validation. Consistent approach. Get runtime validation and TypeScript types from a single source of truth."
      },
      {
        "label": "Plain TypeScript interfaces",
        "selected": false,
        "reason": "Simpler syntax but no runtime validation. Would need separate validation logic or trust API responses blindly."
      },
      {
        "label": "Class hierarchy with validation in constructors",
        "selected": false,
        "reason": "Heavier pattern. Classes add ceremony without benefit for data-transfer objects."
      }
    ]
  }
}
```

### Thought 8 — Type conversion complete (action_report)

```json
{
  "operation": "thought",
  "args": {
    "thought": "Converted all shared types to zod schemas in src/types.ts. WeatherData (7 fields), Location (lat/lng/name), Alert (severity enum, region, message, expires). Exported both schemas and inferred types. Updated all handlers to use the new schemas for response validation.",
    "thoughtType": "action_report",
    "nextThoughtNeeded": true,
    "actionResult": {
      "success": true,
      "reversible": "yes",
      "tool": "file_write",
      "target": "src/types.ts"
    }
  }
}
```

### Thought 9 — Tests written and passing (action_report)

```json
{
  "operation": "thought",
  "args": {
    "thought": "Wrote integration tests using vitest. 12 test cases covering: each handler's happy path (3), input validation rejection (3), API error handling (3), and edge cases (empty alerts, historical date range validation, forecast for coordinates at boundaries). All 12 tests pass. Coverage: 94% line, 88% branch.",
    "thoughtType": "action_report",
    "nextThoughtNeeded": true,
    "actionResult": {
      "success": true,
      "reversible": "yes",
      "tool": "vitest",
      "target": "src/__tests__/"
    }
  }
}
```

### Thought 10 — Final summary (reasoning, closes session)

```json
{
  "operation": "thought",
  "args": {
    "thought": "Refactoring complete. The weather-mcp-server is now TypeScript with full type safety. Key outcomes: 3 handlers converted (get_forecast, get_alerts, get_historical), shared types defined as zod schemas, 12 integration tests passing at 94% coverage. The Python dynamic dispatch pattern was replaced by the MCP SDK's native tool routing. Two architecture decisions were made: single-package structure (over monorepo) and zod schemas (over plain interfaces). No functionality was lost in the conversion.",
    "thoughtType": "reasoning",
    "nextThoughtNeeded": false
  }
}
```

---

## 3. Post-Demo Queries

After the session completes, these queries demonstrate auditability.

### Show only decisions

```json
{
  "operation": "read_thoughts",
  "args": {
    "thoughtType": "decision_frame"
  }
}
```

Expected: Returns 2 thoughts (#2 and #7) with confidence levels and options.

### Show only actions

```json
{
  "operation": "read_thoughts",
  "args": {
    "thoughtType": "action_report"
  }
}
```

Expected: Returns 5 thoughts (#3, #4, #5, #8, #9) with actionResult metadata.

### Full audit summary

```json
{
  "operation": "deep_analysis",
  "args": {
    "sessionId": "<session-id>",
    "analysisType": "audit_summary"
  }
}
```

Expected: Returns aggregated counts (2 decision_frame, 5 action_report, 3 reasoning),
decision confidence breakdown (2 high, 0 medium, 0 low), and action success rate (5/5).

---

## 4. Honest Assessment

### What works well

- **Natural mapping.** The plan-decide-act-reflect cycle maps cleanly onto reasoning,
  decision_frame, action_report, and reasoning again. An agent following the system
  instruction above produces a coherent audit trail without any custom tooling.

- **Queryability is immediate.** The thoughtType filter on read_thoughts lets a reviewer
  jump straight to decisions or actions without scanning the full chain. The audit_summary
  aggregation gives a one-call overview.

- **No code changes needed.** This entire demo works with the existing thought types and
  query operations. The "runbook" is just a prompt convention.

- **Session metadata is free.** sessionTitle and sessionTags on thought #1 give the session
  a human-readable label and make it findable later.

### What feels clunky

- **action_report requires tool/target/reversible for simple progress.** When the agent
  just wants to say "I finished step 3," it has to invent values for tool (e.g.,
  "code_analysis") and target (e.g., "handlers.py") and decide on reversibility. This is
  friction that discourages recording progress. A lighter "progress_report" type with
  just success + description would reduce the barrier.

- **No subtask linking.** Thought #1 lists 8 subtasks, but there is no structured way to
  link subsequent thoughts back to specific subtasks. The agent has to repeat context in
  prose. A `subtaskIndex` or `relatesTo` field would make the runbook queryable by subtask.

- **No explicit "plan" thought type.** Using `reasoning` for both the plan (thought #1)
  and analysis (thought #6) means you cannot query "show me just the plan." A dedicated
  `plan` type or a tags/labels field on individual thoughts would help.

- **totalThoughts is misleading for runbooks.** The auto-assigned totalThoughts equals
  thoughtNumber, which means it keeps growing. For a runbook where you know there are ~10
  steps, you would want to set it upfront, but then you cannot add unplanned thoughts
  without exceeding it. The field is designed for bounded reasoning, not open-ended work logs.

### What the human reviewer sees in the Observatory

- Real-time thought stream with numbered entries and thought types.
- Session start/end events with audit manifest at close.
- The thought text content, which includes the agent's prose descriptions.

### What the human reviewer does NOT see

- The actual code changes (diffs, files created). Only the agent's self-report.
- Whether the agent actually ran the tests or just claimed to.
- Time gaps between thoughts (timestamps exist but are not surfaced prominently).
- A progress bar or checklist view of the plan's subtasks.

### Is this demo-ready as-is?

Yes, with caveats. The 10-thought session is compelling as a walkthrough. The post-demo
queries show real auditability value. The main risk is that the action_report friction
(tool/target/reversible) makes the demo feel over-specified for what is essentially a
progress log. For the demo, the agent instructions paper over this by providing sensible
defaults, but a real agent would find it annoying.

**Score: 4/5** — Demo-ready with the friction noted above. The one missing point is the
inability to link thoughts back to specific plan subtasks, which would make the "runbook"
metaphor fully land.
