# ADR-015: Protocol MCP Tools (Theseus + Ulysses)

**Status**: Accepted
**Date**: 2026-03-19
**Deciders**: Thoughtbox development team

## Context

### Problem

The Theseus (refactoring) and Ulysses (debugging) protocols exist only as shell scripts (`.claude/skills/*/scripts/*.sh`) and SKILL.md documentation. They are not accessible through the MCP server, which means:

1. Protocol state is stored in local files (`.theseus/`, `.ulysses/`) rather than Supabase, breaking the decided architecture (Supabase-only persistence).
2. Non-Claude-Code MCP clients cannot use the protocols at all.
3. Protocol operations are not discoverable via `thoughtbox_operations` or the tool list.
4. No project scoping -- protocol state is global rather than workspace-isolated.

### Constraints from existing ADRs

- **ADR-012 (Gateway API Consistency)**: All Thoughtbox tools use discriminated union schemas with `operation` as the discriminator. Protocol tools must follow this pattern.
- **ADR-009 (Merge Auditability)**: Test at the MCP tool boundary, not internal handlers. Protocol tool tests must call through the tool's `handle()` method.
- **ADR-013 (Storage Project Scoping)**: All storage layers implement `setProject()` for multi-tenant isolation. The `ProtocolHandler` must implement this pattern.
- **ADR-GCP-01 (Cloud Run Service Config)**: Supabase is the sole persistence backend. No local filesystem state for protocol sessions.

### ADR-013 amendment needed

ADR-013 defines `setProject()` on `ThoughtboxStorage` and `KnowledgeStorage`. Protocol operations use neither interface -- they operate on dedicated tables (`protocol_sessions`, `protocol_scope`, etc.). The `ProtocolHandler` must independently implement `setProject()` to filter by `workspace_id`. This extends ADR-013's principle to a new storage layer without modifying the existing interfaces.

### Research decisions

Phase 1 research (2026-03-19) established:
- Project scoping: workspace-isolated per ADR-013
- Disclosure stage: `STAGE_2_CIPHER_LOADED` (protocols require cipher for reasoning trace)
- Cassandra audit automation: deferred (caller-provided `approved` field for now)

## Decision

Add two new MCP tools -- `thoughtbox_theseus` and `thoughtbox_ulysses` -- backed by Supabase, following existing tool patterns.

### Implementation approach

1. **Discriminated union schemas** with `operation` as discriminator (6 operations each), matching the pattern in `src/sessions/tool.ts` and `src/init/tool.ts`.

2. **`registerExplicitTool` registration** at `STAGE_2_CIPHER_LOADED` in `server-factory.ts`, alongside `thoughtbox_thought` and `thoughtbox_notebook`.

3. **Shared `ProtocolHandler` class** (`src/protocol/handler.ts`) with `setProject()` for workspace isolation. All Supabase queries filter by `workspace_id`.

4. **Existing migration** at `supabase/migrations/20260319100319_protocol_enforcement.sql` provides 5 tables and the `check_protocol_enforcement` RPC function.

5. **Tool classes** (`TheseusTool`, `UlyssesTool`) follow the `SessionTool` / `ThoughtTool` pattern: constructor takes handler, `handle()` dispatches on operation.

### Theseus operations

| Operation | Purpose |
|-----------|---------|
| `init` | Declare scope, create protocol session, lock tests |
| `visa` | Apply for out-of-scope file access (epistemic friction) |
| `checkpoint` | Submit diff for audit, record approved/rejected |
| `outcome` | Record test pass/fail after modification |
| `status` | Show B-counter, active visas, audit history |
| `complete` | End session with terminal state |

### Ulysses operations

| Operation | Purpose |
|-----------|---------|
| `init` | Describe problem, create protocol session |
| `plan` | Record primary + recovery steps (pre-committed) |
| `outcome` | Assess result (expected / unexpected-favorable / unexpected-unfavorable) |
| `reflect` | Form falsifiable hypothesis after S=2 |
| `status` | Show S-register, step history, hypothesis chain |
| `complete` | End session with terminal state |

## Consequences

### Positive

- Protocols become first-class MCP tools, discoverable and usable by any MCP client.
- Protocol state persists in Supabase with workspace isolation, consistent with the decided architecture.
- State machines (Ulysses S-register, Theseus B-counter) are tracked in `state_json` on `protocol_sessions`, enabling queries and analytics.
- `check_protocol_enforcement` RPC enables single-roundtrip hook enforcement for clients that support it.
- Shell scripts and local state files (`.theseus/`, `.ulysses/`) become optional convenience wrappers rather than the source of truth.

### Tradeoffs

- **Cassandra audit deferred**: The `checkpoint` operation accepts `approved` as a caller-provided boolean. Without automated adversarial auditing, the protocol relies on the agent's self-assessment or human review. This is a known gap.
- **No hook enforcement for non-CC clients**: The `check_protocol_enforcement` RPC exists but requires client-side hook infrastructure to call it. MCP clients without hooks can use the tools but won't get automatic scope blocking on file writes.
- **Two more tools in the tool list**: After cipher loading, agents see 7 tools instead of 5. The progressive disclosure system mitigates this -- tools only appear after `STAGE_2_CIPHER_LOADED`.

### Neutral

- Hub storage (`HubStorage`) is unaffected.
- Existing `thoughtbox_thought` and `thoughtbox_session` tools are unaffected.
- The shell scripts in `.claude/skills/*/scripts/` continue to work for Claude Code users who prefer the slash command interface.

## Hypotheses

### Hypothesis 1: Protocol tools register into STAGE_2 progressive disclosure and are invocable after cipher
**Prediction**: After calling `thoughtbox_init { operation: "cipher" }`, the tool list includes `thoughtbox_theseus` and `thoughtbox_ulysses`. Before cipher, they are absent. Calling either tool after cipher returns a successful response (not "tool not found").
**Validation**: Start MCP server. List tools at STAGE_0 -- confirm neither protocol tool appears. Call `thoughtbox_init { operation: "get_state" }`, then `{ operation: "start_new" }`, then `{ operation: "cipher" }`. List tools again -- confirm both appear. Call `thoughtbox_theseus { operation: "status" }` -- confirm it returns a response (even if "no active session").
**Outcome**: VALIDATED

### Hypothesis 2: Theseus scope lock prevents out-of-bounds writes via RPC
**Prediction**: After `theseus init` with scope `["src/protocol/"]`, calling `check_protocol_enforcement('src/sessions/tool.ts')` returns `{ enforce: true, blocked: true, reason: "VISA REQUIRED: File outside declared scope" }`. Calling `check_protocol_enforcement('src/protocol/handler.ts')` returns `{ enforce: true, blocked: false }`. Calling `check_protocol_enforcement('tests/protocol.test.ts')` returns `{ enforce: true, blocked: true, reason: "TEST LOCK: Cannot modify test files during refactoring" }`.
**Validation**: Create a Theseus session with scope via direct Supabase insert. Run the RPC function against each path. Verify JSON output matches predictions.
**Outcome**: VALIDATED

### Hypothesis 3: Ulysses S=0->1->2->0 state machine matches SKILL.md
**Prediction**: Starting from `init` (S=0), calling `plan` transitions to S=1. Calling `outcome { assessment: "expected" }` transitions back to S=0. Calling `plan` (S=1) then `outcome { assessment: "unexpected-unfavorable" }` stays at S=1. Another `outcome { assessment: "unexpected-unfavorable" }` transitions to S=2. Calling `reflect` transitions back to S=0. At S=2, calling `plan` returns an error ("REFLECT required before further action").
**Validation**: Execute the full sequence via tool calls, checking `status` after each transition. Verify `state_json.s_register` matches expected values.
**Outcome**: VALIDATED

### Hypothesis 4: Tool handler passthrough correctly conveys discriminated union args
**Prediction**: All 12 operations (6 per tool) parse successfully through Zod discriminated union validation. Each operation's specific fields (e.g., `visa.filePath`, `plan.primary`, `outcome.assessment`) are correctly extracted and passed to the handler. Operations with optional fields (e.g., `init.description`, `outcome.details`) work with and without those fields.
**Validation**: Write unit tests that call `theseusToolInputSchema.parse()` and `ulyssesToolInputSchema.parse()` with valid inputs for each operation. Verify parsing succeeds and extracted values match. Also test invalid inputs (wrong operation, missing required fields) to confirm Zod rejects them.
**Outcome**: VALIDATED

### Hypothesis 5: check_protocol_enforcement RPC returns correct results for all 5 scenarios
**Prediction**: The RPC function handles 5 distinct scenarios: (1) No active session -> `{ enforce: false }`. (2) Theseus active, target is test file -> blocked with "TEST LOCK". (3) Theseus active, target outside scope -> blocked with "VISA REQUIRED". (4) Theseus active, target in scope -> `{ enforce: true, blocked: false }`. (5) Ulysses active -> `{ enforce: true, blocked: false }` (Ulysses does not block file writes).
**Validation**: Set up each scenario via direct table inserts, call `check_protocol_enforcement()` with appropriate paths, verify JSON output.
**Outcome**: VALIDATED

### Hypothesis 6: Tool names/descriptions have no broken references
**Prediction**: `THESEUS_TOOL.description` and `ULYSSES_TOOL.description` reference only MCP tool names that exist (`thoughtbox_theseus`, `thoughtbox_ulysses`, `thoughtbox_init`). They do not reference shell scripts, `.theseus/`, `.ulysses/`, `theseus.sh`, `ulysses.sh`, or other local filesystem artifacts.
**Validation**: `rg '\.theseus/|\.ulysses/|theseus\.sh|ulysses\.sh' src/protocol/` returns 0 hits. Read both tool description strings and verify they contain only MCP tool references.
**Outcome**: VALIDATED

## Spec

[SPEC: Protocol MCP Tools](../../.specs/protocol-mcp-tools.md)

## Links

- [ADR-009: Merge Auditability Experiments](../accepted/ADR-009-merge-auditability-experiments.md) -- test at MCP boundary: STILL VALID
- [ADR-012: Gateway API Consistency](../accepted/ADR-012-gateway-api-consistency.md) -- discriminated union pattern: ADOPTED
- [ADR-013: Storage Project Scoping](../accepted/ADR-013-knowledge-storage-project-scoping.md) -- `setProject()` pattern: EXTENDED to ProtocolHandler
- [ADR-GCP-01: Cloud Run Service Config](../accepted/ADR-GCP-01-cloud-run-service-config.md) -- Supabase-only persistence: ADOPTED
- `.claude/skills/theseus-protocol/SKILL.md` -- Theseus protocol definition (shell-based)
- `.claude/skills/ulysses-protocol/SKILL.md` -- Ulysses protocol definition (shell-based)
- `supabase/migrations/20260319100319_protocol_enforcement.sql` -- existing migration with all 5 tables and RPC
