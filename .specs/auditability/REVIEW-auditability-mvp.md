# Auditability MVP Spec Review

> **Reviewer**: Claude (automated spec review)
> **Date**: 2026-03-01
> **Scope**: SPEC-AUD-001 through SPEC-AUD-005
> **Branch**: claude/review-auditability-specs-a8zIo

---

## Executive Summary

The five auditability specs form a coherent, well-motivated system for "3 AM incident triage" — making agent reasoning auditable through structured decision cards, branch visualization, confidence trails, action logging, and fault attribution. The core infrastructure (`thoughtType` field, operations mode template, branching, critique system) is **already implemented**, which means the MVP is primarily a UI + API filtering effort.

**Overall assessment**: The specs are solid and implementation-ready, with a few issues to address before building.

---

## Spec-by-Spec Review

### SPEC-AUD-001: Timeline — Structured Decision Frames (CRITICAL)

**Verdict**: Ready to implement with minor adjustments.

**Strengths**:
- Clean mapping from `thoughtType` values to distinct card UIs
- Well-defined field tables for each card type (R2-R6)
- Backwards compatibility explicitly called out (verification #5)

**Issues**:

1. **Observatory schema gap (blocking)**: The `ThoughtSchema` in `src/observatory/schemas/thought.ts:13-45` does **not** include `thoughtType`. The spec's "Files to Modify" section misses this file. The WebSocket events (`src/observatory/channels/reasoning.ts:198-238`) also omit `thoughtType` from all three event payloads (`thought:added`, `thought:revised`, `thought:branched`). The spec mentions this in R1 but the files-to-modify table only lists `src/observatory/index.ts` and `src/observatory/reasoning.ts` — it should explicitly list `src/observatory/schemas/thought.ts` and `src/observatory/channels/reasoning.ts`.

2. **Parsing strategy unspecified**: R2 says "parse the structured content" from thought text, but doesn't specify the parsing approach. The operations mode template uses `DECISION:`, `OPTIONS:`, `SELECTED:` etc. as plaintext markers in free-form thought content. The spec should specify whether to use regex parsing, structured delimiters, or promote these fields to structured data on ThoughtData. Regex parsing of LLM-generated text is fragile — the spec should acknowledge this and define fallback behavior when parsing fails.

3. **Visual linking (R4)**: "Action report cards display a back-reference to their preceding decision frame" — the linking strategy relies on sequential proximity (implied), but this isn't stated explicitly until SPEC-AUD-004 R3. Should be made explicit here.

---

### SPEC-AUD-002: Branch Point — Visual Decision Nodes (HIGH)

**Verdict**: Ready to implement, but R2 is ambitious for MVP.

**Strengths**:
- Correctly leverages existing `branchFromThought` / `branchId` infrastructure
- R4 (branch metadata in topology) is a smart optimization — avoids loading all content just to render the tree

**Issues**:

1. **R2 scope creep risk**: A full side-by-side branch comparison view with "first 2-3 thoughts of each path" is a significant UI component. For an MVP, consider: is a simple expandable branch indicator (R1) sufficient, with comparison view deferred?

2. **R3 implicit dependency**: "If a decision_frame immediately precedes a branch" — what does "immediately precedes" mean? Same `thoughtNumber`? `thoughtNumber - 1`? The spec should define the proximity window, matching SPEC-AUD-004 R3's approach.

3. **`get_structure` currently returns**: The spec says R4 should add branch origin metadata to `get_structure`. Worth verifying the current response shape to define the exact additions needed. The spec's files-to-modify lists `src/gateway/gateway-handler.ts` but should also reference the operations schema in `src/gateway/operations.ts` for the response type.

---

### SPEC-AUD-003: Confidence Trail (HIGH)

**Verdict**: Well-designed but the most complex spec. Consider phasing.

**Strengths**:
- R1 pragmatically chooses text parsing over schema changes for MVP
- R5 (aggregate confidence view) provides genuine session-level value
- Correctly identifies the "critique override" case as high-signal for incident triage

**Issues**:

1. **R3 "critique not addressed" detection is hard**: Determining whether "the next thought in the chain references or addresses the critique" requires semantic analysis, not just text matching. This is under-specified. Simpler alternative: show all critiques with their resolution status as a list, let the human judge.

2. **R4 assumption flip timeline is a separate UI component**: This is effectively a sub-timeline overlay. The spec should clarify: is this a filter on the main timeline, or a literally separate visual element? If separate, it adds significant UI surface area.

3. **R5 aggregate view dependencies**: "Count of critiques generated vs addressed" depends on the critique-addressing detection from R3. If R3's detection is simplified, R5's counts change too.

4. **Overlap with SPEC-AUD-001 R6**: SPEC-AUD-001 already defines assumption_update card rendering. SPEC-AUD-003 R4 adds an assumption flip timeline. The relationship between the individual cards (AUD-001) and the aggregated timeline (AUD-003) should be explicit — are they the same data rendered differently, or does R4 introduce new aggregation logic?

---

### SPEC-AUD-004: External Actions — Blast Radius (CRITICAL)

**Verdict**: Most impactful spec. The `thoughtType` filter is low-hanging fruit; blast radius is higher effort.

**Strengths**:
- R1 (`thoughtType` filter on `read_thoughts`) is trivially implementable — ~5 lines of code in `gateway-handler.ts:690-705`
- R4 (gap detection) is clever — catches the fundamental weakness of voluntary action reporting
- R5 (action manifest) provides a clean session-close summary

**Issues**:

1. **R1 schema location**: The spec says add `thoughtType` to `read_thoughts` inputSchema in `operations.ts`. Currently `thoughtType` is on the `thought` operation (line 76-79) but NOT on `read_thoughts` (lines 92-128). This is correct — the spec accurately identifies the gap.

2. **R3 blast radius causal linking is simplistic**: "An action_report is linked to the most recent preceding decision_frame" — this works for linear chains but breaks when sessions have branches. A decision_frame on branch A shouldn't be linked to an action_report on the main chain. The spec should specify branch-aware proximity: only link within the same branch/chain.

3. **R4 gap detection window**: "Configurable, default: 3 thoughts" — is this 3 thoughts on the same branch, or 3 thoughts globally? In a branchy session, a decision_frame might be followed by 3 thoughts on an exploratory branch before the action_report on the main chain. Needs branch-awareness.

4. **R5 action manifest trigger**: "When `nextThoughtNeeded: false`" — this is the right trigger but the manifest generation location (`src/thought-handler.ts`) means it runs in the thought processing pipeline. Consider: should the manifest be generated lazily (on read) rather than eagerly (on session close)? Eager generation means the manifest is stale if thoughts are later added to the session.

5. **R6 redundant**: "Advertise in Discovery Schema" is already covered by R1. This requirement adds no new information.

---

### SPEC-AUD-005: Session Context — Fault Attribution (HIGH)

**Verdict**: The fault attribution checklist (R4) is the highest-value piece. The rest is incremental.

**Strengths**:
- R4's three-step checklist (instructions → data → reasoning) is genuinely useful and simple to implement as static UI
- R2 correctly identifies that operations mode Phase 1-2 already produce the right content, just need `thoughtType: belief_snapshot`
- R3 leverages existing tool registry stage tracking

**Issues**:

1. **R1 session context panel**: "Agent identity (agentId, agentName) if present" — these fields exist on ThoughtData (verified in `gateway-handler.ts:599-600`) but are per-thought, not per-session. The spec should clarify: take agentId from thought #1, or aggregate across all thoughts (which could differ in multi-agent sessions)?

2. **R5 fault attribution storage**: "Stored as a session annotation or a special thought" — this ambiguity should be resolved before implementation. A session annotation is cleaner (doesn't pollute the thought chain) but requires new infrastructure. A special thought is simpler but semantically wrong — it's human metadata, not agent reasoning.

3. **`attributedBy` field**: Assumes a human identity system. How is this populated in the Observatory? If the Observatory is unauthenticated (likely for a dev tool), this is just a free-text field. Worth calling out.

---

## Cross-Cutting Issues

### 1. Missing Source Document

All five specs reference `pain/3am-auditability.md` as their source. **This file does not exist in the repository.** The `pain/` directory doesn't exist at all. The specs are orphaned from their motivation document. Either the pain doc was never committed, or it was removed. This should be addressed — the pain doc provides context for prioritization decisions.

### 2. Spec Location: `.specs/` vs `specs/`

Per `AGENTS.md`: "Specs go in `specs/` (not `.specs/)." These five specs are in `.specs/auditability/`. They should be moved to `specs/auditability/` to follow project conventions, or the convention should be explicitly amended for draft/pre-acceptance specs.

### 3. Observatory HTML is a Monolith

All five specs list `src/observatory/ui/*.html` as a file to modify. There is exactly one file: `observatory.html`. Adding 4 card types, branch comparison view, confidence badges, actions panel, context panel, and fault attribution checklist to a single HTML file will make it unmanageable. The implementation plan should consider extracting components or using a templating approach.

### 4. No Test Specifications

None of the five specs define unit or integration tests. The "Verification" sections describe manual testing scenarios but don't specify automated test expectations. For an MVP this is acceptable, but it should be a conscious decision, not an oversight.

### 5. Dependency Graph

```
AUD-001 (card rendering)
  ├── AUD-002 depends on AUD-001 (decision_frame → branch linkage)
  ├── AUD-003 depends on AUD-001 (confidence badges on decision_frame cards)
  ├── AUD-004 depends on AUD-001 (action_report card rendering)
  └── AUD-005 depends on AUD-001 (belief_snapshot card rendering)
                    └── AUD-005 depends on AUD-003 (confidence trail for reasoning check)
```

AUD-001 is the critical path. Everything depends on it. The implementation order should be:
1. AUD-001 (unblocks everything)
2. AUD-004 R1 (trivial `thoughtType` filter — immediate value)
3. AUD-005 R4 (static checklist UI — high value, low effort)
4. AUD-003 (confidence visualization)
5. AUD-002 (branch visualization)
6. AUD-004 R2-R5 (blast radius, gap detection, manifest)
7. AUD-005 R1-R3, R5 (context panel, tool inventory, attribution storage)

### 6. Effort Estimates

The specs estimate 19-29 hours total. This seems optimistic given:
- The Observatory HTML is a single monolithic file requiring structural work
- Parsing structured content from free-form LLM text is inherently fragile
- Branch-aware causal linking (AUD-004 R3) has non-trivial edge cases

A more realistic estimate: 30-40 hours including the parsing/linking edge cases.

---

## Implementation Readiness Checklist

| Prerequisite | Status | Notes |
|-------------|--------|-------|
| `thoughtType` on ThoughtData | DONE | `src/thought-handler.ts:40` |
| `thoughtType` in persistence | DONE | `src/persistence/types.ts:107` |
| `thoughtType` in gateway input schema | DONE | `src/gateway/operations.ts:76-79` |
| `thoughtType` in gateway handler | DONE | `src/gateway/gateway-handler.ts:597` |
| `thoughtType` in read_thoughts response | DONE | `src/gateway/gateway-handler.ts:717` |
| Operations mode template | DONE | `src/prompts/contents/interleaved-template.ts:267-311` |
| Branch infrastructure | DONE | `branchFromThought`, `branchId` on ThoughtData |
| Critique infrastructure | DONE | Phase 3 sampling loops |
| Tool registry stages | DONE | `src/tool-registry.ts` |
| `thoughtType` in Observatory schema | **MISSING** | `src/observatory/schemas/thought.ts` lacks field |
| `thoughtType` in WebSocket events | **MISSING** | `src/observatory/channels/reasoning.ts:198-238` |
| `thoughtType` filter on read_thoughts | **MISSING** | `src/gateway/operations.ts:92-128` |
| Structured card rendering | **MISSING** | `src/observatory/ui/observatory.html` |
| Pain source document | **MISSING** | `pain/3am-auditability.md` not in repo |

---

## Recommendations

1. **Move specs** from `.specs/auditability/` to `specs/auditability/` per project convention
2. **Create or commit** the `pain/3am-auditability.md` source document
3. **Resolve the parsing strategy** for structured fields in thought content (AUD-001 R2) before implementation
4. **Add `thoughtType` to Observatory schema and WebSocket events** as a prerequisite task (blocks all UI work)
5. **Implement AUD-004 R1** (`thoughtType` filter on `read_thoughts`) immediately — it's 5 lines of code with immediate API value
6. **Scope AUD-002 R2** (branch comparison view) as a stretch goal, not MVP
7. **Simplify AUD-003 R3** (critique-not-addressed detection) to a list view rather than semantic analysis
8. **Define branch-aware proximity** for causal linking (AUD-004 R3) before implementation
9. **Decide fault attribution storage** (AUD-005 R5) — session annotation vs special thought — before implementation
10. **Plan Observatory UI modularization** before adding 5+ new component types to a single HTML file
