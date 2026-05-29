# Case the Joint: Ulysses Through Thoughtbox from Codex

## Access path

Codex does not currently receive direct legacy handles named
`mcp__thoughtbox__thoughtbox_gateway` or `mcp__thoughtbox__thoughtbox_ulysses`.

The exposed Thoughtbox interface is a JavaScript sandbox:

- Discovery: `thoughtbox_search`
- Execution: `thoughtbox_execute`
- Ulysses call shape: `tb.ulysses({ ... })`
- Notebook validator setup: `tb.notebook.create(...)`, `tb.notebook.addCell(...)`

This is the effective Ulysses access path from Codex:

```ts
await tb.ulysses({
  operation: "init",
  problem: "...",
  constraints: ["..."],
});
```

Each `thoughtbox_execute` call should contain at most one state-mutating Ulysses
operation. Read-only calls like `status` are safe to use for confirmation.

## Confirmed working operations

The following Ulysses flow worked from Codex through `thoughtbox_execute`:

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

- Ulysses session: `9d8f43e8-4369-4e72-af1b-b15b5e2601a7`
- Validator notebook: `uu3znqg4tlp`
- Primary validator cell: `4hfv4qbq7df`
- Recovery validator cell: `yepywtmsjl`
- Primary validator verdict: `pass: true`
- Snapshot hash matched: `true`
- Ulysses assessment: `expected`
- State transition: `S=1 -> S=0`

## Confirmed call examples

Initialize Ulysses:

```ts
await tb.ulysses({
  operation: "init",
  problem: "Connectivity and capability probe from Codex.",
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
  title: "Ulysses Protocol Codex capability probe validators",
  language: "typescript",
});
```

Add a validator cell:

```ts
await tb.notebook.addCell({
  notebookId: "uu3znqg4tlp",
  cellType: "code",
  filename: "primary-validator.ts",
  content: `import { observed, pass, fail } from "./tb-validate.js";

interface Observed {
  status: "ok" | "fail";
  marker: string;
}

const d = observed<Observed>();
if (d.status === "ok" && d.marker === "codex-ulysses-probe") {
  pass("Codex Ulysses probe primary validator passed");
} else {
  fail("Codex Ulysses probe primary validator failed", d);
}
`,
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
    notebookId: "uu3znqg4tlp",
    cellId: "4hfv4qbq7df",
  },
  recoveryValidator: {
    notebookId: "uu3znqg4tlp",
    cellId: "yepywtmsjl",
  },
});
```

Submit observed data:

```ts
await tb.ulysses({
  operation: "outcome",
  observed: {
    status: "ok",
    marker: "codex-ulysses-probe",
  },
  details: "Positive primary-path capability probe from Codex.",
});
```

## Confirmed failing path

`bind_final_validator` failed during the probe:

```ts
await tb.ulysses({
  operation: "bind_final_validator",
  notebookId: "uu3znqg4tlp",
  cellId: "4hfv4qbq7df",
});
```

Observed error:

```text
Failed to record final_validator_bound event: new row for relation
"protocol_history" violates check constraint
"protocol_history_event_type_check"
```

Interpretation:

- The Ulysses tool can be reached and used from Codex.
- Plan-time validator binding works.
- Outcome-time validator execution works.
- Snapshot hash matching works.
- The final-validator binding path appears broken server-side or
  schema-migration-side.
- Because final-validator binding failed, `complete(resolved)` hard-gated by a
  final validator was not confirmed.

## Current practical baseline

For this session, Codex can safely use Ulysses through `thoughtbox_execute` for:

- `init`
- `status`
- `plan`
- `outcome`
- `reflect`, if the protocol reaches `S=2`
- `complete` with non-`resolved` terminal states

Do not rely on final-validator-gated `complete(resolved)` until the
`protocol_history_event_type_check` issue is fixed.
