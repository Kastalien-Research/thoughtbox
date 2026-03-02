# SPEC-AUDIT-003: Session Audit Manifest

> **Status**: Draft
> **Priority**: HIGH (Auditability MVP)
> **Phase**: 3AM Auditability — Backend Data Layer
> **Source**: [pain/3am-auditability.md](../../pain/3am-auditability.md)
> **Depends on**: SPEC-AUDIT-001, SPEC-AUDIT-002
> **Blocks**: None

## Summary

Auto-generate a machine-readable audit manifest when a session closes. The manifest is a structured summary of everything the agent decided, did, and assumed — answering "what happened?" without requiring the engineer to re-read the entire thought chain.

## Problem Statement

After SPEC-AUDIT-001 and SPEC-AUDIT-002, the data exists and is queryable. But at 3 AM, the engineer doesn't want to compose queries. They want a pre-computed summary: how many decisions, how many failed actions, any ignored critiques, any assumption flips. The session manifest is this summary — generated once at session close, stored alongside the session, and available instantly.

## Design

### When is the manifest generated?

The manifest is generated when a session closes naturally — when a thought arrives with `nextThoughtNeeded: false`. This happens in `ThoughtHandler._processThoughtImpl` at the existing session-close path (around line 710 of `thought-handler.ts`).

The manifest is **not** generated for:

- Sessions that are abandoned (no explicit close)
- Sessions that are manually closed via the `session` operation (different from a thought-driven close)

If a manifest is needed for these cases, it can be generated on-demand via `deep_analysis` with `analysisType: "audit_summary"` (SPEC-AUDIT-002).

### Where is the manifest stored?

The manifest is stored as part of the session's auto-export data. Specifically:

1. It is included in the `SessionExport` interface alongside the existing `nodes` and `revisionAnalysis` fields
2. It is available via the `deep_analysis` operation with `analysisType: "audit_manifest"` (a new analysis type that retrieves the stored manifest rather than recomputing)
3. It is emitted as part of the `session_completed` event payload (SIL-104 event stream)
4. It is included in the Observatory `session_ended` WebSocket event

### What does it contain?

## `AuditManifest` Interface

```typescript
interface AuditManifest {
  /** Session this manifest belongs to */
  sessionId: string;

  /** When the manifest was generated (ISO 8601) */
  generatedAt: string;

  /** Thought count breakdown by type */
  thoughtCounts: {
    total: number;
    reasoning: number;
    decision_frame: number;
    action_report: number;
    belief_snapshot: number;
    assumption_update: number;
  };

  /** Decision summary */
  decisions: {
    total: number;
    byConfidence: {
      high: number;
      medium: number;
      low: number;
    };
  };

  /** Action summary */
  actions: {
    total: number;
    successful: number;
    failed: number;
    reversible: number;
    irreversible: number;
    partiallyReversible: number;
  };

  /** Detected audit gaps */
  gaps: Array<{
    type: "decision_without_action" | "critique_override";
    thoughtNumber: number;
    description: string;
  }>;

  /** Assumption change summary */
  assumptionFlips: number;

  /** Critique handling summary */
  critiques: {
    generated: number;
    addressed: number;
    overridden: number;
  };
}
```

This is structurally identical to the `audit_summary` output from SPEC-AUDIT-002, but persisted at session close rather than computed on demand. This intentional duplication means `audit_summary` and the manifest always agree — they use the same generation logic.

## Files to Modify

### `src/persistence/types.ts`

1. Add `AuditManifest` interface (as defined above)
2. Add optional `auditManifest?: AuditManifest` field to `SessionExport` interface

### `src/thought-handler.ts`

1. Add a private `generateAuditManifest` method that:
   - Takes the session's thoughts (from `this.thoughtHistory`)
   - Computes all the counts, aggregations, and gap detection
   - Returns an `AuditManifest` object

2. In the session-close path of `_processThoughtImpl` (where `nextThoughtNeeded: false`):
   - Call `generateAuditManifest` before the auto-export
   - Include the manifest in the session close response
   - Pass the manifest to the event emitter

3. The gap detection and critique analysis logic should be extracted into a shared utility used by both `generateAuditManifest` and the `audit_summary` handler in `gateway-handler.ts` — avoid duplicating the aggregation logic.

### `src/gateway/gateway-handler.ts`

1. Add `"audit_manifest"` to the `deep_analysis` `analysisType` enum
2. In `handleDeepAnalysis`, add a branch for `audit_manifest`:
   - Retrieve the stored manifest from the session export data
   - If no manifest exists (session not closed, or pre-AUDIT-003 session), compute one on-the-fly using the same logic as `audit_summary`
   - Return the manifest

### `src/gateway/operations.ts`

1. Add `"audit_manifest"` to the `analysisType` enum in the `deep_analysis` operation schema
2. Update the description to mention the new analysis type

### `src/observatory/schemas/events.ts`

1. Add `AuditManifestSchema` (Zod schema matching the `AuditManifest` interface)
2. Update `SessionEndedPayloadSchema` to include an optional `auditManifest` field

### Event Payloads

The manifest is included in two event payloads:

**Observatory WebSocket (`session_ended`):**
```typescript
{
  type: "session_ended",
  data: {
    sessionId: string;
    finalThoughtCount: number;
    auditManifest?: AuditManifest;  // NEW
  }
}
```

**SIL-104 JSONL event stream (`session_completed`):**
```typescript
{
  type: "session_completed",
  sessionId: string;
  finalThoughtCount: number;
  branchCount: number;
  auditManifest?: AuditManifest;  // NEW
}
```

## Shared Audit Logic

The aggregation logic (counting by type, aggregating decisions/actions, detecting gaps, analyzing critiques) is used in three places:

1. `generateAuditManifest` in `thought-handler.ts` (session close)
2. `handleDeepAnalysis` with `audit_summary` in `gateway-handler.ts` (on-demand)
3. `handleDeepAnalysis` with `audit_manifest` in `gateway-handler.ts` (fallback computation)

Extract this into a standalone function:

```typescript
// src/audit/manifest-generator.ts
export function generateAuditData(
  sessionId: string,
  thoughts: ThoughtData[]
): AuditManifest
```

This function takes an array of thoughts and returns a fully-computed `AuditManifest`. All three call sites use it, ensuring consistency.

## Verification

### Unit Tests

1. **Manifest generation on session close**: Submit a sequence of typed thoughts ending with `nextThoughtNeeded: false`. Verify the response includes `auditManifest` with correct counts.
2. **Manifest thought counts**: Submit known distribution of types. Verify each count matches.
3. **Manifest decision aggregation**: Submit decision frames at each confidence level. Verify `byConfidence` breakdown.
4. **Manifest action aggregation**: Submit successful/failed/reversible/irreversible action reports. Verify all counts.
5. **Manifest gap detection**: Submit a decision frame with no following action report. Verify gap appears in manifest.
6. **Manifest critique analysis**: Submit a thought with critique followed by a thought that ignores it. Verify `overridden` count increments.
7. **On-demand manifest via deep_analysis**: Request `audit_manifest` for a closed session. Verify manifest is returned.
8. **On-demand fallback for open session**: Request `audit_manifest` for a session that hasn't closed. Verify a computed manifest is returned (not an error).
9. **Manifest in session export**: Export a closed session. Verify `auditManifest` field is present in the export JSON.

### Integration Test

1. Submit a full audit session:
   - `belief_snapshot` (initial state)
   - `decision_frame` (low confidence)
   - `action_report` (success, reversible)
   - `assumption_update` (believed -> refuted)
   - `decision_frame` (high confidence, with critique)
   - `reasoning` (ignores critique)
   - `action_report` (failure, irreversible)
   - Close session with `nextThoughtNeeded: false` (reasoning type)
2. Verify session close response includes `auditManifest`
3. Verify manifest:
   - `thoughtCounts.total` = 8
   - `thoughtCounts.decision_frame` = 2
   - `thoughtCounts.action_report` = 2
   - `decisions.byConfidence.low` = 1
   - `decisions.byConfidence.high` = 1
   - `actions.successful` = 1
   - `actions.failed` = 1
   - `actions.reversible` = 1
   - `actions.irreversible` = 1
   - `assumptionFlips` = 1
   - `critiques.overridden` = 1
   - `gaps` has entry for critique override
4. Retrieve manifest via `deep_analysis` with `analysisType: "audit_manifest"` — verify identical to session close manifest
