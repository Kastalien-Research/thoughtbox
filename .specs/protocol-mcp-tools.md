# SPEC: Protocol MCP Tools (Theseus + Ulysses)

**ADR**: `.adr/staging/ADR-015-protocol-mcp-tools.md`
**Date**: 2026-03-19

## Overview

Two new MCP tools -- `thoughtbox_theseus` and `thoughtbox_ulysses` -- expose the Theseus and Ulysses protocols as first-class Thoughtbox operations. Both follow the discriminated union pattern (ADR-012), register via `registerExplicitTool` at `STAGE_2_CIPHER_LOADED` (progressive disclosure), and persist state to Supabase via a shared `ProtocolHandler` class with project scoping (ADR-013).

## Tool Definitions

### `thoughtbox_theseus`

Structured refactoring protocol. Prevents scope drift via boundary locking, test-write locks, epistemic visas, and adversarial auditing (Cassandra).

**Operations**: `init`, `visa`, `checkpoint`, `outcome`, `status`, `complete`

```typescript
export const theseusToolInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("init"),
    scope: z.array(z.string())
      .describe("File paths or directory prefixes in scope for this refactor"),
    description: z.string().optional()
      .describe("Brief description of the refactoring goal"),
  }),
  z.object({
    operation: z.literal("visa"),
    filePath: z.string()
      .describe("Path of the out-of-scope file requiring modification"),
    justification: z.string()
      .describe("Why this file must be modified (e.g., compiler dependency)"),
    antiPatternAcknowledged: z.boolean().default(true)
      .describe("Agent acknowledges this is scope creep and accepts the friction cost"),
  }),
  z.object({
    operation: z.literal("checkpoint"),
    diffHash: z.string()
      .describe("Hash of the git diff being submitted for audit"),
    commitMessage: z.string()
      .describe("Proposed atomic commit message (must not contain compound actions)"),
    approved: z.boolean()
      .describe("Whether the Cassandra audit approved this checkpoint"),
    feedback: z.string().optional()
      .describe("Cassandra audit feedback (rejection reason or approval notes)"),
  }),
  z.object({
    operation: z.literal("outcome"),
    testsPassed: z.boolean()
      .describe("Whether tests pass after the modification"),
    details: z.string().optional()
      .describe("Details about test results or compile status"),
  }),
  z.object({
    operation: z.literal("status"),
  }),
  z.object({
    operation: z.literal("complete"),
    terminalState: z.enum(["complete", "audit_failure", "scope_exhaustion"])
      .describe("How the protocol session ended"),
    summary: z.string().optional()
      .describe("Summary of the refactoring outcome"),
  }),
]);
```

**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false }`

### `thoughtbox_ulysses`

Structured debugging protocol. Prevents hallucinated progress via surprise gating, pre-committed recovery steps, and falsifiable hypotheses.

**Operations**: `init`, `plan`, `outcome`, `reflect`, `status`, `complete`

```typescript
export const ulyssesToolInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("init"),
    problem: z.string()
      .describe("Description of the bug or problem being debugged"),
    constraints: z.array(z.string()).optional()
      .describe("Known constraints on the debugging environment"),
  }),
  z.object({
    operation: z.literal("plan"),
    primary: z.string()
      .describe("Primary action step to execute"),
    recovery: z.string()
      .describe("Pre-committed recovery step if primary produces a surprise"),
    irreversible: z.boolean().default(false)
      .describe("Whether the primary step is irreversible (triggers rollback recording)"),
  }),
  z.object({
    operation: z.literal("outcome"),
    assessment: z.enum(["expected", "unexpected-favorable", "unexpected-unfavorable"])
      .describe("How the outcome compared to the plan"),
    severity: z.number().min(1).max(2).optional()
      .describe("Surprise severity (1=minor, 2=major). Required for unexpected outcomes."),
    details: z.string().optional()
      .describe("What actually happened"),
  }),
  z.object({
    operation: z.literal("reflect"),
    hypothesis: z.string()
      .describe("Falsifiable hypothesis formed from the surprise"),
    falsification: z.string()
      .describe("Concrete, observable criteria that would disprove this hypothesis"),
  }),
  z.object({
    operation: z.literal("status"),
  }),
  z.object({
    operation: z.literal("complete"),
    terminalState: z.enum(["resolved", "insufficient_information", "environment_compromised"])
      .describe("How the protocol session ended"),
    summary: z.string().optional()
      .describe("Summary of the debugging outcome"),
  }),
]);
```

**Annotations**: `{ readOnlyHint: false, destructiveHint: false, idempotentHint: false }`

## Supabase Tables

All tables are defined in the existing migration at `supabase/migrations/20260319100319_protocol_enforcement.sql`. No new migration is needed.

| Table | Purpose |
|-------|---------|
| `protocol_sessions` | Active/completed protocol sessions. Discriminated by `protocol` column (`theseus` or `ulysses`). Status CHECK constraint enforces protocol-specific terminal states. |
| `protocol_scope` | Theseus-only. Files in scope for the refactoring session. Source is `init` or `visa`. UNIQUE on `(session_id, file_path)`. |
| `protocol_visas` | Theseus-only. Epistemic visa applications for out-of-scope file access. |
| `protocol_audits` | Theseus-only. Cassandra audit results (diff hash, commit message, approved/rejected). |
| `protocol_history` | Both protocols. Step history as JSONB events (`plan`, `outcome`, `reflect`, `checkpoint`). |

**RPC**: `check_protocol_enforcement(target_path text)` -- single-roundtrip function for hook enforcement. Returns JSON with `enforce`, `blocked`, `reason`, `session_id`, `protocol` fields. Covers 5 scenarios: no active session, Theseus test file blocked, Theseus out-of-scope blocked, Theseus in-scope allowed, Ulysses active.

All tables have RLS enabled with service_role bypass policies.

## ProtocolHandler

Shared handler class for both protocol tools. Located at `src/protocol/handler.ts`.

```typescript
export class ProtocolHandler {
  private client: SupabaseClient;
  private workspaceId: string | null = null;

  constructor(client: SupabaseClient) { ... }

  // ADR-013: project scoping
  setProject(project: string): void { ... }

  // Theseus operations
  async theseusInit(scope: string[], description?: string): Promise<...>
  async theseusVisa(sessionId: string, visa: VisaInput): Promise<...>
  async theseusCheckpoint(sessionId: string, audit: AuditInput): Promise<...>
  async theseusOutcome(sessionId: string, result: OutcomeInput): Promise<...>
  async theseusStatus(sessionId: string): Promise<...>
  async theseusComplete(sessionId: string, state: TheseusTerminal): Promise<...>

  // Ulysses operations
  async ulyssesInit(problem: string, constraints?: string[]): Promise<...>
  async ulyssesPlan(sessionId: string, plan: PlanInput): Promise<...>
  async ulyssesOutcome(sessionId: string, outcome: OutcomeInput): Promise<...>
  async ulyssesReflect(sessionId: string, reflection: ReflectInput): Promise<...>
  async ulyssesStatus(sessionId: string): Promise<...>
  async ulyssesComplete(sessionId: string, state: UlyssesTerminal): Promise<...>
}
```

### Project Scoping

The `ProtocolHandler` follows the `setProject()` pattern from ADR-013. The `workspace_id` column on `protocol_sessions` maps to the project scope. All queries filter by `workspace_id` to enforce multi-tenant isolation.

`InitToolHandler.handleBindRoot()` and `handleStartNew()` call `protocolHandler.setProject()` alongside existing storage `setProject()` calls.

### State Machine

**Theseus session states**: `active` -> `complete` | `audit_failure` | `scope_exhaustion` | `superseded`

**Ulysses session states**: `active` -> `resolved` | `insufficient_information` | `environment_compromised` | `superseded`

**Ulysses S-register**: Tracked in `state_json` on `protocol_sessions`.
- `S=0` (PLAN): Agent must record a plan before acting
- `S=1` (ACT/OUTCOME): Agent has a plan, must report outcome
- `S=2` (REFLECT): Two unexpected outcomes require hypothesis formation before continuing
- Transition: `S=0 -> plan -> S=1 -> outcome(expected) -> S=0`
- Surprise path: `S=0 -> plan -> S=1 -> outcome(unexpected) -> S=1 -> outcome(unexpected) -> S=2 -> reflect -> S=0`

**Theseus B-counter**: Tracked in `state_json` on `protocol_sessions`.
- `B=0`: Clean state, eligible for checkpoint
- `B>0`: Modified state, tests may or may not pass
- `B` increments on each modification, resets to 0 on successful checkpoint

## Progressive Disclosure

Both tools register at `DisclosureStage.STAGE_2_CIPHER_LOADED`, same as `thoughtbox_thought` and `thoughtbox_notebook`. Rationale: protocol tools require the agent to have loaded cipher notation (for reasoning trace recording) and completed init (for project scoping).

Registration in `server-factory.ts`:

```typescript
registerExplicitTool(THESEUS_TOOL, theseusTool, DisclosureStage.STAGE_2_CIPHER_LOADED);
registerExplicitTool(ULYSSES_TOOL, ulyssesTool, DisclosureStage.STAGE_2_CIPHER_LOADED);
```

## Tool Classes

Follow the same pattern as `SessionTool` and `ThoughtTool`:

```typescript
// src/protocol/theseus-tool.ts
export class TheseusTool {
  constructor(private handler: ProtocolHandler) {}
  async handle(input: TheseusToolInput) { ... }
}

// src/protocol/ulysses-tool.ts
export class UlyssesTool {
  constructor(private handler: ProtocolHandler) {}
  async handle(input: UlyssesToolInput) { ... }
}
```

The `handle()` method dispatches on `input.operation`, calls the appropriate `ProtocolHandler` method, and returns `{ content: [{ type: "text", text: JSON.stringify(result) }] }`.

## Session ID Management

Protocol tools track the active session ID. The `init` operation returns the session ID in its response. Subsequent operations use the handler's tracked "current active session" per protocol type (one active Theseus session, one active Ulysses session). Status and complete operations use the active session.

This mirrors how `ThoughtHandler` tracks the current session -- the agent calls `init` once, then subsequent operations implicitly use the active session.

## File Layout

```
src/protocol/
  handler.ts          # ProtocolHandler (Supabase operations)
  theseus-tool.ts     # TheseusTool class + schema + THESEUS_TOOL constant
  ulysses-tool.ts     # UlyssesTool class + schema + ULYSSES_TOOL constant
  types.ts            # Shared types (VisaInput, PlanInput, etc.)
  index.ts            # Re-exports
```

## Acceptance Criteria

| ID | Criterion | Hypothesis |
|----|-----------|------------|
| AC-1 | Both tools appear in tool list after cipher is loaded, not before | H1 |
| AC-2 | `theseus init` with scope creates session; writes to out-of-scope files return visa-required error from `check_protocol_enforcement` RPC | H2 |
| AC-3 | `ulysses init -> plan -> outcome(unexpected) -> outcome(unexpected) -> reflect -> status` correctly transitions S=0->1->1->2->0 and status reflects this | H3 |
| AC-4 | Discriminated union args parse correctly for all 12 operations (6 per tool) | H4 |
| AC-5 | `check_protocol_enforcement` returns correct JSON for: no session, test file, out-of-scope, in-scope, Ulysses active | H5 |
| AC-6 | Tool names and descriptions contain no references to shell scripts, `.theseus/`, `.ulysses/`, or nonexistent tools | H6 |

## Deferred

- **Cassandra audit automation**: The `checkpoint` operation accepts `approved` as a caller-provided boolean. True adversarial auditing (spawning an LLM to evaluate the diff) is deferred to a separate ADR. For now, the agent or a human provides the audit verdict.
- **Hook enforcement for non-Claude-Code clients**: `check_protocol_enforcement` RPC exists but is only callable from clients that implement hook infrastructure. Non-CC clients can still use the tools but won't get automatic scope blocking.
- **Gateway passthrough validation gap**: The protocol tools are standalone (not gateway sub-operations), so the 3-layer gateway validation gap from ADR-009 does not apply directly. However, the same principle applies: test at the MCP tool boundary.
