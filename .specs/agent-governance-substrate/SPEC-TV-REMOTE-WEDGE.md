---
spec_id: SPEC-TV-REMOTE-WEDGE
title: TV Remote Wedge — Hook Interception + Gate/Lesson Enforcement Endpoint
status: draft
date: 2026-06-05
branch: feat/tv-remote-tournament
claims:
  - id: c1
    statement: A PreToolUse interception routes every agent action (Bash, Edit, Write, NotebookEdit, and MCP tool calls) through a single Thoughtbox enforcement endpoint that returns a gate verdict, generalizing the existing mutation-only protocol_gate.sh hook to the full action surface.
    type: implementation
    behavioral: false
    required_evidence: A hook registered for the generalized matcher plus the enforcement endpoint handler; the acceptance harness POSTs each action shape and receives a verdict.
  - id: c2
    statement: A categorical or irreversible action (e.g. `git push --force`) for which a gate-eligible constraint is installed is blocked (hook exit 2), and the block carries a retrievable lesson attached to that operation boundary.
    type: behavioral
    behavioral: true
    required_evidence: Acceptance harness Phase A — seed a gate at an operation, POST the matching action, assert decision=block, rung=gate, non-empty lesson.
  - id: c3
    statement: A permitted action is allowed (decision=allow, not blocked) and is recorded as a durable action-trace; the validator/advisory rung warns-but-allows per the keystone reversibility rule.
    type: behavioral
    behavioral: true
    required_evidence: Acceptance harness Phase B — POST a benign action, assert decision=allow and that an action-trace row/file was persisted and is readable.
  - id: c4
    statement: Every intercepted action is persisted as a durable action-trace, and gate-lessons persist alongside, under BOTH storage backends, routed through the central THOUGHTBOX_STORAGE switch and workspace-scoped.
    type: implementation
    behavioral: false
    required_evidence: Trace + lesson persistence verified by the acceptance harness against the fs backend; the supabase path present in code and schema (parity, not exercised in the gate).
  - id: c5
    statement: The gate verdict is computed by server-side validator logic over stored constraints, not by any field the caller supplies; an agent cannot self-report its way past a gate.
    type: governance
    behavioral: true
    required_evidence: Acceptance harness Phase E — POST an action whose args assert success/permission; assert the verdict still blocks. Enforcement path reuses ValidatorService verdict semantics (src/notebook/validator.ts).
  - id: c6
    statement: At most three abstracted MCP action-button operations register through the existing OperationDefinition -> buildTbObject path, sufficient to seed a constraint+lesson and read back action-traces.
    type: implementation
    behavioral: false
    required_evidence: New operations in src/<module>/operations.ts, Zod schema, sdk-types stub, search-index import, buildTbObject dispatch; the acceptance harness drives seed + read via the tb SDK.
  - id: c7
    statement: A lesson attached to a gate from a prior blocked attempt is surfaced again on a later attempt at the same operation, demonstrating the read side of the environmental-learning loop (retrieval at the operation boundary is stable).
    type: behavioral
    behavioral: true
    required_evidence: Acceptance harness Phase C — repeat the Phase A action after the trace exists; assert the same lesson is returned.
  - id: c8
    statement: When the enforcement endpoint is unreachable, interception fails OPEN — the action is allowed (hook exit 0), never blocked on an infrastructure error — preserving the existing protocol_gate.sh fail-open contract.
    type: behavioral
    behavioral: true
    required_evidence: Acceptance harness Phase D — point the client at a dead endpoint, assert allow/exit 0.
links:
  - .specs/agent-governance-substrate/SPEC-ENVIRONMENTAL-LEARNING-GATES.md
  - .specs/thoughtbox-v1-finalstretch/SPEC-DRIFT-PREVENTION-HOOKS.md
  - plugins/thoughtbox-claude-code/hooks/hooks.json
  - src/notebook/validator.ts
  - src/protocol/handler.ts
---

# SPEC: TV Remote Wedge — Hook Interception + Gate/Lesson Enforcement Endpoint

**Status**: DRAFT — research artifact and tournament input. Not accepted.
**Parent**: `SPEC-ENVIRONMENTAL-LEARNING-GATES.md` — this is the "concrete near-term wedge" that spec names (its §"Concrete near-term wedge", line 143): a hook-based interception layer that routes actions through Thoughtbox for gating + durable action-memory, plus a few abstracted MCP action buttons, positioning Thoughtbox as the **universal remote's firmware** rather than a replacement set of buttons.

## Why this spec exists

This is the fixed input for a best-of-N tournament: ~30 independent implementations of the wedge are generated in parallel, gated against the acceptance harness below, and ranked by a judge panel. The spec therefore does two jobs and must do them in opposite directions:

- It **pins the contract** (the enforcement request/response shape and the acceptance scenario) so that every candidate is solving the same problem and the gate is the same ruler for all of them.
- It **leaves the architecture open** (how gates and lessons are represented, stored, retrieved, and ranked; how the rung is selected; where the enforcement logic is factored) so the tournament has something worth selecting over.

Fix the interface; vary the implementation.

## What already exists (do not rebuild)

A candidate that rebuilds these from scratch is wrong. The wedge is a generalization of a working skeleton, mapped here so candidates extend rather than reinvent:

- **`plugins/thoughtbox-claude-code/hooks/hooks.json` + `scripts/protocol_gate.sh`** — a `PreToolUse` hook on `Edit|Write|NotebookEdit` that `POST`s to `${THOUGHTBOX_URL}/protocol/enforcement` and **blocks via exit code 2** on a `{blocked, reason, protocol, required_action}` response. Network failure **fails open** (exit 0). This is the interception skeleton to generalize.
- **`scripts/otlp_tool_capture.sh`** — a `PostToolUse` hook on all tools emitting every action as an OTLP trace. The trace pipe already exists; action-traces are the durable, queryable counterpart.
- **`src/notebook/validator.ts` (`ValidatorService`)** — `bind()` freezes a cell + deps to a `snapshotHash`; `run()` spawns a subprocess that writes a verdict to `TB_VERDICT_PATH`; the **verdict, not the agent's claim, drives the transition**. This is the enforcement primitive the gate reuses (keystone §Forms: the validator contract `{pass, reason, evidence}` is "identical to the Ulysses validator-cell contract already shipped").
- **`src/code-mode/execute-tool.ts` `buildTbObject()` + `src/<module>/operations.ts`** — the registration path for a new `tb` action-button operation (define `OperationDefinition`, add `Tool.handle`, Zod schema, `sdk-types.ts` stub, `search-index.ts` import, `buildTbObject` dispatch).
- **`src/index.ts` `THOUGHTBOX_STORAGE` switch + FileSystemStorage/SupabaseStorage** — the dual backend. Action-traces and gate-lessons persist under both, workspace-scoped, routed through this switch (NOT by sniffing `process.env.SUPABASE_URL` directly — that is the split-brain bug pattern this repo is actively removing).

## The fixed problem (every candidate delivers this)

1. **Generalize interception.** A `PreToolUse` hook intercepts the full action surface (`Bash`, `Edit`, `Write`, `NotebookEdit`, and `mcp__*` tool calls), not just mutations, and routes each through the enforcement endpoint.
2. **Enforce at one endpoint.** Extend `POST /protocol/enforcement` to evaluate the action against stored constraints, retrieve any lesson attached at that operation boundary, persist an action-trace, and return the verdict contract below.
3. **Persist durably.** Action-traces and gate-lessons are written through the central storage switch under both backends, workspace-scoped.
4. **Expose ≤3 action buttons.** Enough `tb` operations to seed a constraint + lesson and read back traces, so the loop is drivable through the SDK.

### The enforcement contract (PINNED — do not vary)

Request (hook → server), generalized from the shipped mutation-only payload:

```json
POST {THOUGHTBOX_URL}/protocol/enforcement
{
  "action": {
    "tool": "Bash|Edit|Write|NotebookEdit|mcp__<server>__<tool>",
    "args": { "...": "verbatim tool input" },
    "targetPath": "/abs/path or null",
    "command": "the bash command string or null"
  },
  "workspaceId": "string or null",
  "sessionId": "string or null"
}
```

Response (server → hook):

```json
{
  "decision": "allow | block",
  "reason": "human-readable string",
  "lesson": "string or null (retrieved lesson attached to this operation/gate)",
  "rung": "advisory | validator | shadow | gate",
  "traceId": "id of the persisted action-trace",
  "requiredAction": "reflect | visa | null"
}
```

Hook behavior: `decision === "block"` → exit 2, stderr carries `reason` + `lesson`. Otherwise exit 0; on `validator`/`shadow` rungs a non-empty `lesson` may be surfaced to stderr without blocking. Unreachable endpoint → exit 0 (fail open). The legacy `blocked: boolean` field MAY be emitted as an alias for backward compatibility but `decision` is authoritative.

The **rung** values are the keystone's vocabulary (`SPEC-ENVIRONMENTAL-LEARNING-GATES.md` §Structural unification). The wedge must *honor* the reversibility rule — only irreversible/categorical/boundary constraints are gate-eligible; reversible harms cap at `validator` — but it does not need to implement the full promotion/demotion controller (see Out of scope).

### Pinned support routes (the acceptance-harness seam — do not vary)

So the ruler can seed and inspect without coupling to internal design, candidates expose two more routes backed by the same service the action buttons use:

```
POST {THOUGHTBOX_URL}/protocol/constraints
  body: { "operation": "Bash", "match": "git push --force", "rung": "gate",
          "irreversible": true, "lesson": "force-push to a shared branch is unrecoverable; use --force-with-lease on your own branch" }
  -> { "constraintId": "string" }

GET  {THOUGHTBOX_URL}/protocol/traces?limit=50
  -> { "traces": [ { "traceId", "action": {...}, "decision", "rung", "constraintId"|null, "at" } ] }
```

These exist for testability and may be thin wrappers over the same logic the ≤3 action buttons call; their internal implementation is open. The action-button *names* remain the candidate's choice.

### Pinned interception path (so exit-code semantics are testable)

The generalized hook is **extended in place** at `plugins/thoughtbox-claude-code/scripts/protocol_gate.sh`, preserving its existing contract: it reads the PreToolUse JSON on stdin, calls the enforcement endpoint via `${THOUGHTBOX_URL}`, **exits 2 to block** (stderr carries reason + lesson) and **exits 0 to allow**, and **fails open (exit 0) when the endpoint is unreachable**. The harness invokes this script directly to verify the exit-code semantics (block and fail-open). How it generalizes the matcher beyond `Edit|Write|NotebookEdit` is the candidate's choice, but this path and contract are fixed.

## Acceptance contract (the ruler — identical for all candidates)

The tournament injects a fixed acceptance harness (`.claude/workflows/tv-remote/acceptance.mjs`) into each candidate worktree (re-overlaid from main; candidates cannot edit it) and runs it headlessly against a locally started server on the `fs` backend in an isolated data dir. A candidate **passes the gate** iff every phase passes and `pnpm build` succeeds.

**Anti-gaming invariant.** Every phase keys off a per-run **nonce** — the command string and the constraint `match` contain it, so a candidate cannot hardcode them. The verdict must derive from the seeded, stored constraint: a string-match stub fails by construction.

- **Phase A — negative control + block + linked trace.** POST a nonce-bearing action *before* seeding; assert `decision="allow"` (no constraint installed ⇒ must not block). Then seed a gate-eligible constraint (`irreversible:true`, `match` = the nonce token) with a nonce-bearing lesson. POST the action again; assert `decision="block"`, `rung="gate"`, a lesson that contains the nonce, a `traceId`, and a persisted action-trace whose `constraintId` equals the seeded id.
- **Phase B — allow + no cross-talk.** Seed a *second*, unrelated constraint. Assert a benign nonce-bearing action is allowed and trace-persisted, and that the Phase-A action still blocks with the *Phase-A* lesson (constraints do not bleed).
- **Phase C — retrieval (env-learning read side).** Repeat the Phase-A action; assert the same lesson is surfaced again (stable retrieval at the operation boundary).
- **Phase D — hook semantics.** Via the pinned hook: it blocks (exit 2) the *novel seeded* command (proving it relays the server verdict, not a baked-in string), allows (exit 0) a benign command while the server is reachable, and fails open (exit 0) when the endpoint is unreachable.
- **Phase E — no self-report bypass.** Seed a constraint on a *novel, otherwise-allowed* command; POST it with `args` asserting `decision:"allow"`/success. Assert it still blocks (the server verdict ignores caller-supplied fields).

## What is deliberately open (where the 30 vary)

- Constraint representation and the addressing scheme (per-operation, per-argument-pattern grain — keystone §The grain problem).
- Storage shape of action-traces and gate-lessons under each backend, and the retrieval/ranking that surfaces the right lesson at an operation (keystone open question §Where constraints live).
- How the rung is selected and where enforcement logic is factored (in the endpoint, a service, the ValidatorService, or split).
- Whether the generalized hook replaces or sits beside `protocol_gate.sh`; the matcher strategy.
- The shape and naming of the ≤3 action-button operations.

## Out of scope (do not implement; future work)

- The **generation step** — auto-authoring a constraint predicate from a session-end surprise (keystone open question; the credit-assignment problem). In the wedge, constraints + lessons are **seeded explicitly** through an action button, not generated. Demonstrate the storage + retrieval + enforcement loop, not the authoring of it.
- The full promotion/demotion controller, shadow-gate windows, friction-budget accounting (keystone §§Shadow gates, friction budget). The wedge must not contradict them, but implements only static rung honoring.
- Weight-learning / RL dataset export.
- Multi-tenant auth hardening on the enforcement endpoint beyond existing workspace scoping.

## Non-negotiable constraints

- Dual-backend parity preserved; route through the central `THOUGHTBOX_STORAGE` switch, never a direct `process.env.SUPABASE_URL` sniff.
- Fail-open on enforcement network/infra error is mandatory (c8). A wedge that can hard-block an agent because the server is down is a regression.
- Do not break existing hooks, tests, or the shipped `{blocked,...}` consumers.
- No new dependencies: `package.json`, the lockfile, and root `scripts/` are restored from main at gate time, so an added dependency breaks the gate build by construction.
- Conventional Commits; code+spec in the same change; respect repo hard limits (≤100 lines/function, absolute imports).
