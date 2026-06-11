---
name: ulysses-protocol
description: Thoughtbox-first Ulysses workflow for surprise-gated debugging. Use this when debugging gets uncertain and you need explicit plan, outcome, and reflection discipline without relying on local shell state.
argument-hint: <init|plan|outcome|reflect|status|complete> [args]
user-invocable: true
allowed-tools: Read, Glob, Grep, Task, Agent, mcp__thoughtbox__thoughtbox_search, mcp__thoughtbox__thoughtbox_execute
---

# Ulysses Protocol

Ulysses is a Thoughtbox-owned debugging protocol.

The invariants live in the server-side Ulysses implementation behind
`tb.ulysses(...)`.
The durable trace lives in Thoughtbox thoughts and knowledge.
Claude Code hooks only enforce the current server state.

Do not use `.ulysses/` files or `scripts/ulysses.sh` as authoritative state.
Do not use legacy direct handles like `thoughtbox_gateway` or `thoughtbox_ulysses`
as the interaction surface when Code Mode is available.

## API Surface

The current public Thoughtbox MCP surface is Code Mode:

- Discovery: `thoughtbox_search`
- Execution: `thoughtbox_execute`
- Ulysses operations: `tb.ulysses({ ... })`
- Validator notebook setup: `tb.notebook.create(...)` and `tb.notebook.addCell(...)`

Each `thoughtbox_execute` call should contain at most one state-mutating
Ulysses operation. Read-only confirmation calls such as
`tb.ulysses({ operation: "status" })` are safe to use for state checks.

Example execution wrapper:

```ts
async () => {
  return await tb.ulysses({
    operation: "status",
  });
}
```

## Runtime Contract

1. Protocol entry is explicit-only in v1.
2. If you need schema or example confirmation, call `thoughtbox_search` before
   executing.
3. Use `thoughtbox_execute` and call `tb.ulysses({ operation: ... })` for every
   protocol transition.
4. Hooks may block mutating work when the server reports `S=2`; read-only inspection remains allowed.
5. Helper agents may gather evidence after `reflect`, but only the coordinator calls `tb.ulysses`.

## Commands

### `init`

Required inputs:
- Problem statement
- Optional constraints

Call:
```ts
async () => {
  return await tb.ulysses({
    operation: "init",
    problem: "<problem>",
    constraints: ["<optional constraint>"],
  });
}
```

Then record a structured Thoughtbox thought summarizing the debugging context.

### `plan`

Required inputs:
- Primary action
- Recovery action
- **Primary validator**: a notebook code cell that decides the primary step's outcome
- **Recovery validator**: a notebook code cell that decides the recovery step's outcome
- Optional `irreversible`

Each validator is a code cell that reads observed data from `process.env.TB_OBSERVED_PATH` and writes a verdict to `process.env.TB_VERDICT_PATH`. Use the auto-materialised helper:

```ts
import { observed, pass, fail } from "./tb-validate.js";
const d = observed<{ errors: number }>();
d.errors === 0 ? pass("clean run") : fail(`${d.errors} errors`, d);
```

Cells are snapshotted at plan time (source + package.json + tsconfig hashed with sha256). Later edits to the notebook cannot influence the verdict.

Call:
```ts
async () => {
  return await tb.ulysses({
    operation: "plan",
    primary: "<primary action>",
    recovery: "<recovery action>",
    irreversible: false,
    primaryValidator: { notebookId: "<id>", cellId: "<id>" },
    recoveryValidator: { notebookId: "<id>", cellId: "<id>" },
  });
}
```

Do not act before `plan` is recorded.

### `outcome`

Required inputs:
- `observed`: any JSON-serialisable value piped into the validator cell bound for the current S phase. The cell's pass/fail verdict — not any agent claim — drives the state machine.
- Optional `details` (free-form notes attached to the history event)

Call:
```ts
async () => {
  return await tb.ulysses({
    operation: "outcome",
    observed: { errorCount: 3, lastLog: "..." },
    details: "<what happened>",
  });
}
```

State transitions derived from the verdict:
- Validator pass → assessment `expected`, S→0, checkpoint
- Validator fail at S=1 → assessment `unexpected-unfavorable`, S→2, recovery pending
- Validator fail at S=2 → forbidden_moves recorded, REFLECT required
- Snapshot hash mismatch (predicate tampered with after bind) → forces S=2 immediately, records `validator_tampering` history event

If the returned state reaches `S=2` with no `active_step`, stop mutating work and move to `reflect`.

### `bind_final_validator`

Pin a notebook code cell as the predicate that gates `complete(resolved)`. The cell is snapshotted and pinned at bind time.

Call:
```ts
async () => {
  return await tb.ulysses({
    operation: "bind_final_validator",
    notebookId: "<id>",
    cellId: "<id>",
  });
}
```

### `reflect`

Required inputs:
- Falsifiable hypothesis
- Falsification criteria

Call:
```ts
async () => {
  return await tb.ulysses({
    operation: "reflect",
    hypothesis: "<hypothesis>",
    falsification: "<what would disprove it>",
  });
}
```

After `reflect`, you may optionally launch debugger or researcher agents to test competing explanations. They return evidence only. The coordinator records the next `plan` or `outcome`.

### `status`

Call:
```ts
async () => {
  return await tb.ulysses({
    operation: "status",
  });
}
```

Use the returned server state as the only source of truth.

### `complete`

`terminalState='resolved'` is **hard-gated** by the final validator if one is bound. The agent must supply `observed` data; the validator runs against the pinned snapshot, and the terminal is rejected if the validator returns fail or its hash does not match.

Call:
```ts
async () => {
  return await tb.ulysses({
    operation: "complete",
    terminalState: "resolved",
    observed: { errorCount: 0, passingTests: 42 },
    summary: "<transferable learning>",
  });
}
```

The other terminals (`insufficient_information`, `environment_compromised`) do not run the final validator and accept the existing call shape.

Completion should yield both protocol closure and a reusable knowledge artifact in Thoughtbox.

## Invariants

1. No action without a recorded primary step and recovery step **with bound validator cells**.
2. Outcomes are deterministic: the validator cell — not the agent — decides assessment.
3. Predicates are frozen at plan time by snapshot hash; tampering forces S=2.
4. Surprises accumulate on the server, not in local files.
5. `reflect` is mandatory at `S=2`.
6. Hypotheses must be falsifiable.
7. `complete(resolved)` is hard-gated by the final validator when bound.
8. Knowledge capture is part of completion, not an optional afterthought.

## Authoring Validator Cells

A validator cell is an ordinary code cell in a Thoughtbox notebook. Use the auto-materialised helper for ergonomics:

```ts
import { observed, pass, fail } from "./tb-validate.js";

interface Observed {
  errorCount: number;
  status: "ok" | "degraded" | "down";
}

const d = observed<Observed>();
if (d.status === "ok" && d.errorCount === 0) {
  pass("system healthy");
} else {
  fail(`status=${d.status}, errors=${d.errorCount}`, d);
}
```

Verdict semantics: `pass` → assessment `expected`. `fail` → assessment `unexpected-unfavorable`. Anything else (no verdict file, malformed JSON, crash, timeout) → `pass=false, reason="malformed_verdict"`.

Authoring rules:
- Keep cells deterministic. The same observed input must produce the same verdict.
- Make the predicate as specific as possible — that's where the anti-gaming property comes from.
- Write the cell **before** taking the step; revising it after seeing the observed data defeats the purpose.

## Subagent Use

Use subagents only after `reflect` when more evidence would help.

Good uses:
- Reproduce a hypothesis independently
- Compare two candidate explanations
- Gather targeted code or log evidence

Bad uses:
- Letting a subagent call `tb.ulysses`
- Letting a hook spawn subagents automatically
- Treating subagents as owners of protocol state

## References

- Public MCP surface: `thoughtbox_search`, `thoughtbox_execute`
- Ulysses SDK call: `tb.ulysses({ operation: ... })`
- Durable context and thought trace: Thoughtbox session, thought, and knowledge
  operations through Code Mode
- Protocol implementation: `src/protocol/ulysses-tool.ts`
- Specification reference: `references/protocol-spec.md`
