# SPEC-AUDIT-001: Structured Audit Fields on ThoughtData

> **Status**: Draft
> **Priority**: CRITICAL (Auditability MVP)
> **Phase**: 3AM Auditability — Backend Data Layer
> **Source**: [pain/3am-auditability.md](../../pain/3am-auditability.md)
> **Depends on**: None
> **Blocks**: SPEC-AUDIT-002, SPEC-AUDIT-003

## Summary

Make `thoughtType` a required field on every thought and define a discriminated union where each type carries its own structured metadata. This transforms the thought chain from an opaque prose log into a machine-queryable audit trail.

## Problem Statement

Thoughtbox currently stores all reasoning as unstructured text in the `thought` field. The `thoughtType` field exists but is optional and limited to four types. When debugging a 3 AM failure, engineers must read paragraphs of prose to reconstruct what the agent decided, did, observed, and assumed. Structured fields enable filtering, aggregation, and visual rendering without parsing natural language.

## Breaking Change

`thoughtType` becomes **required** on every thought submitted via the `thought` operation. Callers that omit it receive a validation error:

```
"thoughtType is required. Use 'reasoning' for general-purpose thoughts, or a specific type for auditable decisions/actions."
```

This is intentional. Optional fields degrade over time — agents skip them, and the audit trail reverts to untyped blobs. The breaking change is scoped: add `thoughtType: "reasoning"` to any call that doesn't need structured fields.

## Discriminated Union

The `thoughtType` field determines which structured fields are required:

### `reasoning` (catch-all)

General-purpose reasoning. No additional required fields.

```typescript
{
  thoughtType: "reasoning",
  thought: "The architecture uses a gateway pattern...",
  nextThoughtNeeded: true
}
```

### `decision_frame`

A decision point where the agent chose between options. Required structured fields:

| Field | Type | Description |
|-------|------|-------------|
| `confidence` | `"high" \| "medium" \| "low"` | Agent's self-assessed confidence in the decision |
| `options` | `Array<{ label: string, selected: boolean, reason?: string }>` | Options considered. Exactly one must have `selected: true` |

```typescript
{
  thoughtType: "decision_frame",
  thought: "Deciding between REST and GraphQL for the new API...",
  nextThoughtNeeded: true,
  confidence: "medium",
  options: [
    { label: "REST", selected: true, reason: "Simpler, team has more experience" },
    { label: "GraphQL", selected: false, reason: "More flexible but higher learning curve" }
  ]
}
```

### `action_report`

A report of an action the agent took (or attempted). Required structured fields:

| Field | Type | Description |
|-------|------|-------------|
| `actionResult` | `object` | Structured action outcome (see below) |

**`actionResult` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | `boolean` | Yes | Whether the action succeeded |
| `reversible` | `"yes" \| "no" \| "partial"` | Yes | Whether the action can be undone |
| `tool` | `string` | No | Name of the tool/API called |
| `target` | `string` | No | What the action targeted (file path, URL, entity ID) |
| `sideEffects` | `string[]` | No | Observable side effects beyond the primary action |

```typescript
{
  thoughtType: "action_report",
  thought: "Deployed v2.1.0 to staging. Health checks passing.",
  nextThoughtNeeded: true,
  actionResult: {
    success: true,
    reversible: "yes",
    tool: "deploy-cli",
    target: "staging-cluster",
    sideEffects: ["invalidated CDN cache", "triggered smoke test suite"]
  }
}
```

### `belief_snapshot`

A checkpoint of the agent's current understanding of the world state. Required structured fields:

| Field | Type | Description |
|-------|------|-------------|
| `beliefs` | `object` | Structured belief state (see below) |

**`beliefs` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entities` | `Array<{ name: string, state: string }>` | Yes | Key entities and their current known state |
| `constraints` | `string[]` | No | Active constraints the agent is operating under |
| `risks` | `string[]` | No | Known risks or uncertainties |

```typescript
{
  thoughtType: "belief_snapshot",
  thought: "Current understanding of the deployment state...",
  nextThoughtNeeded: true,
  beliefs: {
    entities: [
      { name: "staging", state: "v2.1.0 deployed, healthy" },
      { name: "production", state: "v2.0.9, stable" },
      { name: "database", state: "migration pending" }
    ],
    constraints: ["maintenance window closes at 04:00 UTC"],
    risks: ["migration may lock users table for 30s"]
  }
}
```

### `assumption_update`

A change in the agent's assumptions about the world. Required structured fields:

| Field | Type | Description |
|-------|------|-------------|
| `assumptionChange` | `object` | What assumption changed (see below) |

**`assumptionChange` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | Yes | The assumption being updated |
| `oldStatus` | `string` | Yes | Previous status (free-form, e.g., "believed", "uncertain") |
| `newStatus` | `"believed" \| "uncertain" \| "refuted"` | Yes | New status (constrained enum) |
| `trigger` | `string` | No | What caused the status change |
| `downstream` | `number[]` | No | Thought numbers of decisions that depended on this assumption |

```typescript
{
  thoughtType: "assumption_update",
  thought: "Database migration is non-blocking — this was wrong...",
  nextThoughtNeeded: true,
  assumptionChange: {
    text: "Database migration is non-blocking",
    oldStatus: "believed",
    newStatus: "refuted",
    trigger: "Migration took 45s with full table lock",
    downstream: [12, 15]
  }
}
```

## Files to Modify

### `src/persistence/types.ts`

Update the `ThoughtData` interface:

1. Add `"reasoning"` to the `thoughtType` union
2. Make `thoughtType` required (remove `?`)
3. Add structured fields for each type:
   - `confidence?: "high" | "medium" | "low"`
   - `options?: Array<{ label: string; selected: boolean; reason?: string }>`
   - `actionResult?: { success: boolean; reversible: "yes" | "no" | "partial"; tool?: string; target?: string; sideEffects?: string[] }`
   - `beliefs?: { entities: Array<{ name: string; state: string }>; constraints?: string[]; risks?: string[] }`
   - `assumptionChange?: { text: string; oldStatus: string; newStatus: "believed" | "uncertain" | "refuted"; trigger?: string; downstream?: number[] }`

The fields are optional at the type level because only the discriminated union validation enforces which are required per `thoughtType`. TypeScript can't express discriminated unions with optional properties on a flat interface — runtime validation fills this gap.

### `src/thought-handler.ts`

1. Add `"reasoning"` to the `ThoughtData.thoughtType` union type
2. Make `thoughtType` required in `ThoughtData` interface (remove `?`)
3. Update `validateThoughtData`:
   - Reject thoughts without `thoughtType`
   - Validate discriminated union: check that the required structured fields are present for each `thoughtType`
   - Pass through structured fields to persistence
4. Update `_processThoughtImpl` to include structured fields in the `PersistentThoughtData` object passed to storage

### `src/gateway/operations.ts`

Update the `thought` operation `inputSchema`:

1. Add `"reasoning"` to the `thoughtType` enum
2. Move `thoughtType` to `required` array
3. Add property schemas for each structured field:
   - `confidence` (string enum)
   - `options` (array of objects)
   - `actionResult` (object)
   - `beliefs` (object)
   - `assumptionChange` (object)

### `src/gateway/gateway-handler.ts`

Update `handleThought` to pass structured fields through to `ThoughtHandler.processThought`:

- `confidence`, `options`, `actionResult`, `beliefs`, `assumptionChange`

### `src/observatory/schemas/thought.ts`

Add to `ThoughtSchema`:

1. `thoughtType` field (required enum with all 5 types)
2. Structured fields as optional Zod schemas (validation happens at input, not at observatory render)

### `src/observatory/schemas/events.ts`

Ensure `ThoughtAddedPayloadSchema`, `ThoughtRevisedPayloadSchema`, and `ThoughtBranchedPayloadSchema` include `thoughtType` and structured fields in their `thought` object — these flow from the updated `ThoughtSchema`.

## Validation Rules

The discriminated union validation in `validateThoughtData` enforces:

| `thoughtType` | Required fields | Validation |
|---|---|---|
| `reasoning` | None | Always passes |
| `decision_frame` | `confidence`, `options` | `options` must be non-empty; exactly one option must have `selected: true` |
| `action_report` | `actionResult` | `actionResult.success` must be boolean; `actionResult.reversible` must be `"yes"`, `"no"`, or `"partial"` |
| `belief_snapshot` | `beliefs` | `beliefs.entities` must be non-empty |
| `assumption_update` | `assumptionChange` | `assumptionChange.newStatus` must be `"believed"`, `"uncertain"`, or `"refuted"` |

Invalid structured data returns a descriptive error message naming the missing or invalid field.

## Verification

### Unit Tests

1. **Happy path**: Submit a thought for each `thoughtType` with valid structured fields. Verify persistence stores all fields.
2. **Missing thoughtType**: Submit a thought without `thoughtType`. Expect validation error.
3. **Missing required structured fields**: Submit `decision_frame` without `confidence`. Expect validation error naming the missing field.
4. **Invalid structured data**: Submit `decision_frame` with no selected option. Expect validation error.
5. **Reasoning passthrough**: Submit `reasoning` type with no extra fields. Verify success.
6. **Extra fields ignored**: Submit `reasoning` with `confidence` (irrelevant to reasoning). Verify it's stored but not validated.

### Breaking Change Verification

1. Run existing test suite. All tests calling `thought` without `thoughtType` must fail.
2. Fix each failing test by adding `thoughtType: "reasoning"`.
3. Verify full test suite passes after updates.

### Integration Test

1. Submit a sequence: `decision_frame` -> `action_report` -> `belief_snapshot` -> `assumption_update` -> `reasoning`
2. Read all thoughts back via `read_thoughts`
3. Verify each thought has its `thoughtType` and structured fields intact
