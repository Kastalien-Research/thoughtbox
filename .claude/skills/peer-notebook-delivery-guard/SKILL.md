---
name: peer-notebook-delivery-guard
description: >
  Govern ADR-022 MCP peer notebook implementation units. Use before or during
  durable control-plane, manifest lifecycle, web app inspection, runtime
  provider, or isolation/policy hardening work to prevent mock substitution,
  scope drift, and incomplete acceptance evidence.
argument-hint: <unit name or implementation plan>
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

Guard MCP peer notebook delivery for: $ARGUMENTS

## Purpose

This skill is the delivery guardrail for ADR-022. It keeps large implementation
units aligned with the brokered peer notebook end state:

- governed peer identities
- approved manifests
- brokered inbound invocation
- broker-proxied outbound access
- durable invocations, traces, and artifacts
- web-app inspection
- real runtime providers behind explicit contracts

Use this skill whenever work touches `.specs/mcp-peer-notebooks/`,
`.adr/staging/ADR-022.json`, `src/peer-notebook/`, peer notebook Supabase
migrations, peer notebook web app routes, or runtime providers.

## Required Reads

Read these before planning or editing:

1. `AGENTS.md`
2. `.adr/staging/ADR-022.json`
3. `.specs/mcp-peer-notebooks/SPEC-CONTROL-PLANE.md`
4. `.specs/mcp-peer-notebooks/README.md`
5. `.specs/mcp-peer-notebooks/NEXT-IMPLEMENTATION-HANDOFF.md`

If the work touches app UI, also read `apps/web/AGENTS.md`.

## Hard Rule

Mocks are contract fixtures, not final substitutes.

A mock, in-memory store, stubbed provider, fake broker target, or local-only
stand-in may prove shape, schema, trace semantics, and client reachability. It
does not satisfy the production requirement for the capability it represents.

Before any unit is complete, every mocked or in-memory component touched must
be either:

1. replaced by a real implementation behind the same contract,
2. narrowed to test-only/non-production use by code and docs, or
3. explicitly deferred in the user-selected tracker or handoff artifact with the real replacement named.

If a mock fulfills the function of the thing it mocks in a final acceptance
claim, the unit is not complete.

## Large Unit Boundaries

Pick exactly one primary unit unless the user explicitly asks for a larger
combined effort.

| Unit | Capability Produced | Explicit Non-Goals |
| --- | --- | --- |
| Durable Control Plane | Supabase-backed peers, manifests, invocations, traces, and artifacts while runtime remains mock-capable | Web app pages, real runtime isolation |
| Manifest Lifecycle And Notebook Graduation | Compile `peer.manifest.json` from real notebook source, store drafts, approve/activate/retire manifests | Runtime provider expansion, UI beyond minimal admin/read APIs |
| Web App Inspection Surface | Peer registry/detail, invocation list/detail, trace timeline, artifact preview from durable rows | New runtime providers, migration redesign |
| Real Runtime Provider Path | `local-process` integration provider behind runtime contract, marked development-only | Production isolation claims |
| Production Isolation And Policy Hardening | Isolated execution provider, enforced network/filesystem/secrets/budget policy, adversarial acceptance | Treating local-process or mock as production |

If work crosses a unit boundary, stop and record/link follow-up work in the user-selected tracker or handoff artifact before proceeding.

## Workflow

### 1. Classify The Unit

Write a short classification before editing:

```text
Unit:
ADR claims advanced:
Spec sections touched:
Production capability expected:
Mocks/in-memory components involved:
Explicit non-goals:
Tracker/handoff reference:
```

If there is no tracker reference and tracker writes are in scope, create or request one. If tracker writes are unavailable, record the gap in the handoff and do not create a fallback tracker.

### 2. Define Acceptance Before Code

Every unit must have observable acceptance criteria before implementation:

- positive path
- negative path
- workspace scoping path where relevant
- trace/artifact/read-model evidence where relevant
- mock accountability outcome

Acceptance must name concrete files, rows, API responses, UI states, or tests.
Avoid acceptance phrased only as "implemented support for X."

### 3. Mock Accountability Gate

Before code review or completion, produce this table:

| Component | Real Capability It Stands In For | Current Scope | Replaced/Narrowed/Deferred | Tracker/Handoff Follow-Up |
| --- | --- | --- | --- | --- |
| `MockPeerRuntimeProvider` | Runtime execution provider | test/pilot | deferred | `thoughtbox-...` |

Rules:

- `Current Scope` must be `test-only`, `pilot-only`, `development-only`, or
  `production`.
- `production` is allowed only for real implementations.
- If `Deferred`, the follow-up issue is mandatory.
- If the unit claims final acceptance for a capability, the corresponding row
  cannot be `mock`, `in-memory`, or `stub`.

### 4. Unit Failure-Mode Gates

Apply only the gate for the active unit.

#### Durable Control Plane

Reject the unit if:

- schema names drift from `SPEC-CONTROL-PLANE.md` without a spec update
- workspace scoping is not tested
- in-memory repository remains the only implementation
- trace or artifact writes can partially succeed without visible status/error
- durable seed -> invoke -> trace -> artifact flow is untested

Required evidence:

- migration files
- repository contract tests against Supabase-shaped storage
- verification query or test proving invocation, trace, and artifact rows exist

#### Manifest Lifecycle And Notebook Graduation

Reject the unit if:

- compiling a manifest executes notebook code
- draft manifests can be invoked
- notebook edits silently change active capabilities
- manifest hash is unstable across equivalent JSON
- approval/activation can be bypassed

Required evidence:

- malformed JSON, duplicate manifest, draft, active, retired, and expansion
  denial tests
- active manifest hash asserted during invocation

#### Web App Inspection Surface

Reject the unit if:

- UI reads mock/local state instead of durable rows
- denied calls are hidden
- artifact previews fetch unbounded full payloads
- workspace filtering is not represented in query tests or fixtures
- `src/observatory` becomes a deployed dependency

Required evidence:

- browser or component tests for peer detail, invocation detail, denied event,
  and artifact preview states

#### Real Runtime Provider Path

Reject the unit if:

- `local-process` is described as production isolation
- provider behavior diverges from mock contract tests
- runtime can bypass broker proxy for Thoughtbox/MCP calls
- runtime writes final artifacts outside broker-owned artifact paths
- timeout/cancel/failure transitions are ambiguous

Required evidence:

- shared provider contract tests
- explicit development-only labeling for local-process
- queued -> running -> terminal status tests

#### Production Isolation And Policy Hardening

Reject the unit if:

- Cloud Run becomes the privileged execution host
- network, filesystem, secrets, or outbound tool policy is doc-only
- budget counters are not enforced and traceable
- denied outbound calls can reach the target
- mock or local-process satisfies production isolation acceptance

Required evidence:

- adversarial tests for denied network/tool/filesystem/secrets access
- isolated provider end-to-end acceptance
- persisted budget and denial trace events

### 5. Implementation Discipline

- Preserve broker/repository/runtime contracts unless the ADR/spec changes.
- Add real implementations beside mocks; do not mutate mocks into production
  implementations.
- Keep deferred surfaces deferred unless this unit explicitly owns them.
- Update `.specs/` and ADR artifacts in the same commit as behavior changes.
- Do not touch unrelated dirty files.

### 6. Completion Report

End with:

```text
Peer Notebook Delivery Guard Report

Unit:
Tracker/handoff reference:
ADR/spec alignment:
Mocks touched:
Mock accountability:
Acceptance evidence:
Tests run:
Deferred issues filed:
Known risks:
Ready for PR/merge: yes|no
```

If `Ready for PR/merge` is `yes`, there must be no untracked mock replacement
work hidden in prose.
