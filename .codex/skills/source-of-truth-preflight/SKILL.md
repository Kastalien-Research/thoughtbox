---
name: source-of-truth-preflight
description: >
  Use this skill before implementing features, lifecycle changes, runtime
  boundaries, persistence contracts, or architectural work where the codebase
  may already contain canonical domain models. It prevents duplicate
  abstractions, illegal representable states, and plans built on the wrong
  source of truth.
---

# Source Of Truth Preflight

Run this skill before editing code for non-trivial feature work, especially
when the task touches domain models, state machines, runtime providers,
repository contracts, schema migrations, or existing subsystem boundaries.

This is a short gate, not a design ceremony. Produce the report before coding.
If the report cannot identify the canonical model or enforcement points, pause
instead of implementing.

## Trigger Conditions

Use this skill when any of these are true:

- adding or changing lifecycle states
- compiling, parsing, importing, exporting, or graduating a domain object
- adding a repository method, migration, runtime provider, broker, or handler
- introducing a new type whose name overlaps an existing concept
- seeing two or more files define similar domain terms
- after two surprises during a task

## Preflight Steps

### 1. Identify The Unit

State the requested unit in one sentence. Name explicit non-goals.

### 2. Inventory Existing Models

Search before designing. Prefer `rg`:

```bash
rg -n "export (interface|type|class|const) .*<Concept>|<Concept>Schema|type <Concept>|interface <Concept>" src apps .specs .adr docs
rg -n "from ['\"].*<concept>.*['\"]|<Concept>" src apps
```

Record:

- canonical model candidates with file references
- legacy or competing models with file references
- runtime/schema/repository boundaries that already enforce the concept

### 3. Choose The Canonical Source Of Truth

Name the model the implementation will build on. If there are multiple live
models, classify each as one of:

- `canonical`: new work should build here
- `legacy-live`: still used, but not the right extension point
- `adapter-only`: used only to translate between systems
- `control-plane`: metadata/registry state, not the domain object itself
- `test-fixture`: fixture-only, not production semantics

If the choice is not obvious, pause and ask for a decision.

### 4. Illegal-State Pass

List the states that should be impossible. Check whether current types make
them impossible.

Look for:

- flat records with `status` plus many nullable fields
- generic `string` identifiers for different ID classes
- optional fields that are required for only some statuses
- generic `save*` methods that bypass lifecycle transitions
- casts from storage rows into domain records without parsing
- public tool input objects with many optional fields instead of a
  discriminated union

For each illegal state, decide whether to:

- make it impossible in TypeScript,
- reject it at a parser/boundary,
- enforce it in the database/transaction, or
- explicitly defer it with named risk.

### 5. Acceptance-To-Enforcement Map

For each acceptance criterion, name the enforcing artifact:

- type or schema
- parser or compiler
- repository command
- transaction/RPC/migration constraint
- broker/runtime guard
- test

If an acceptance item maps only to prose or a broad test, mark it as weak.

### 6. Reuse Challenge

Before adding a new service/type/schema, answer:

```text
Why does the existing model/engine/repository not own this?
```

Proceed only when the answer is concrete. Good answers include:

- the existing model is legacy-live and this is an adapter
- the new type is a control-plane read model, not a duplicate domain object
- the existing model lacks a boundary parser and this change adds one

Weak answers include:

- it was faster to write a new shape
- the prompt used different names
- tests can catch it later

### 7. Surprise Gate

After two unexpected findings, stop and write:

- what surprised us
- what assumption failed
- whether the current plan is still valid
- the next bounded action

Do not debug process/tooling or migrate workflow systems inside the feature
session unless that is the explicit unit of work.

## Required Report

Produce this before code edits:

```text
Source Of Truth Preflight

Unit:
Non-goals:

Canonical model:
Legacy/competing models:
Control-plane models:
Adapters needed:

Illegal states currently representable:
Acceptance-to-enforcement map:
New types/services proposed:
Reuse decision:

Surprises:
Proceed / pause:
```

Use file references for every model claim.
