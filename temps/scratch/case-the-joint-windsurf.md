# Case the Joint: Ulysses Through Thoughtbox from Windsurf

## Access path

Windsurf connects to the Thoughtbox server via the MCP 3 prefix. The legacy handles are not used directly.

The exposed Thoughtbox interface is a JavaScript sandbox with the following tool names:

- Discovery: `mcp3_thoughtbox_search`
- Execution: `mcp3_thoughtbox_execute`
- Ulysses call shape: `tb.ulysses({ ... })`
- Notebook validator setup: `tb.notebook.create(...)`, `tb.notebook.addCell(...)`

This is the effective Ulysses access path from Windsurf using `mcp3_thoughtbox_execute`:

```ts
await tb.ulysses({
  operation: "init",
  problem: "...",
  constraints: ["..."],
});
```

Each `mcp3_thoughtbox_execute` call should contain at most one state-mutating Ulysses
operation. Read-only calls like `status` are safe to use for confirmation.

## Confirmed working operations

The following Ulysses flow worked from Windsurf through `mcp3_thoughtbox_execute`:

1. `tb.ulysses({ operation: "init" })`
2. `tb.ulysses({ operation: "status" })`
3. `tb.notebook.create(...)`
4. `tb.notebook.addCell(...)` for validator cells
5. `tb.ulysses({ operation: "plan", primaryValidator, recoveryValidator })`
6. `tb.ulysses({ operation: "outcome", observed })`
7. `tb.ulysses({ operation: "complete", terminalState: "insufficient_information" })`

The important behavioral confirmation is that `outcome` used the bound notebook
validator, not the agent claim, to decide the result.

Observed result from the probe:

- Ulysses session: `5c751da4-b4d8-4a8d-99de-b058c01c1cd2`
- Validator notebook: `26pgw1t6x61`
- Primary validator cell: `15x9yjq3dmw`
- Recovery validator cell: `w53scn2vjii`
- Primary validator verdict: `pass: true`
- Snapshot hash matched: `true` (hash: `f4b8f61fd66b29050ec1cd0b45a87ba81dd883475e8f7954d7be9e06fe7f1c89`)
- Ulysses assessment: `expected`
- State transition: `S=1 -> S=0`

## Confirmed call examples

Initialize Ulysses:

```ts
await tb.ulysses({
  operation: "init",
  problem: "Connectivity and capability probe from Windsurf.",
  constraints: [
    "No repository file mutations during this probe.",
    "Use one Ulysses state-mutating operation per Thoughtbox call.",
    "Treat Thoughtbox server response as the source of truth.",
  ],
});
```

Check status:

```ts
await tb.ulysses({ operation: "status" });
```

Create a validator notebook:

```ts
await tb.notebook.create({
  title: "Ulysses Protocol Windsurf capability probe validators",
  language: "typescript",
});
```

Add a validator cell:

```ts
await tb.notebook.addCell({
  notebookId: "26pgw1t6x61",
  cellType: "code",
  filename: "primary-validator.ts",
  content: `import { observed, pass, fail } from "./tb-validate.js";

interface Observed {
  status: "ok" | "fail";
  marker: string;
}

const d = observed<Observed>();
if (d.status === "ok" && d.marker === "windsurf-ulysses-probe") {
  pass("Windsurf Ulysses probe primary validator passed");
} else {
  fail("Windsurf Ulysses probe primary validator failed", d);
}
`
});
```

Plan with validators:

```ts
await tb.ulysses({
  operation: "plan",
  primary: "Submit a positive observed payload to prove primary validation works.",
  recovery: "Submit a recovery payload if primary validation fails unexpectedly.",
  irreversible: false,
  primaryValidator: {
    notebookId: "26pgw1t6x61",
    cellId: "15x9yjq3dmw",
  },
  recoveryValidator: {
    notebookId: "26pgw1t6x61",
    cellId: "w53scn2vjii",
  },
});
```

Submit observed data:

```ts
await tb.ulysses({
  operation: "outcome",
  observed: {
    status: "ok",
    marker: "windsurf-ulysses-probe",
  },
  details: "Positive primary-path capability probe from Windsurf.",
});
```

## Confirmed failing path

`bind_final_validator` failed during the probe:

```ts
await tb.ulysses({
  operation: "bind_final_validator",
  notebookId: "26pgw1t6x61",
  cellId: "15x9yjq3dmw",
});
```

Observed error:

```text
Failed to record final_validator_bound event: new row for relation
"protocol_history" violates check constraint
"protocol_history_event_type_check"
```

Interpretation:

- The Ulysses tool can be reached and used from Windsurf via `mcp3_thoughtbox_execute`.
- Plan-time validator binding works.
- Outcome-time validator execution works.
- Snapshot hash matching works.
- The final-validator binding path appears broken server-side or
  schema-migration-side.
- Because final-validator binding failed, `complete(resolved)` hard-gated by a
  final validator was not confirmed.

## Current practical baseline

For this session, Windsurf can safely use Ulysses through `mcp3_thoughtbox_execute` for:

- `init`
- `status`
- `plan`
- `outcome`
- `reflect`, if the protocol reaches `S=2`
- `complete` with non-`resolved` terminal states

Do not rely on final-validator-gated `complete(resolved)` until the
`protocol_history_event_type_check` issue is fixed.
