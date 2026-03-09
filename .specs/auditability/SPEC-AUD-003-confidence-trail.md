# SPEC-AUD-003: Confidence Trail — Critique and Risk Surfacing

> **Status**: Draft
> **Priority**: HIGH (Auditability MVP)
> **Phase**: 3AM Auditability
> **Estimated Effort**: 4-6 hours
> **GitHub Issue**: #139
> **Source**: pain/3am-auditability.md — Thing #3

## Summary

Surface confidence levels, critique results, and assumption flips as first-class visual elements in the Observatory. The confidence trail answers "should we have caught this?" — distinguishing unpredictable failures from situations where the agent knew something was risky and proceeded anyway.

## Problem Statement

The critique system exists (Phase 3: Sampling Loops) and operations mode captures CONFIDENCE in decision frames and tracks assumption changes. But none of this is surfaced visually. Critique results are stored but invisible. Confidence is text buried in thought content. Assumption flips aren't linked to downstream decisions. At 3 AM this information is critical for triage.

## Scope

### In Scope
- Parse CONFIDENCE from decision_frame content (or consider promoting to a structured field)
- Observatory UI: color-code or badge decisions by confidence level
- Observatory UI: inline critique results next to the thought they critique
- Observatory UI: highlight critique overrides (critique generated → agent proceeded without addressing)
- Observatory UI: assumption flip timeline showing when assumptions changed
- Observatory UI: downstream impact links from assumption flips to affected decisions

### Out of Scope
- Automated confidence calibration / scoring
- Critique quality assessment

## Requirements

### R1: Confidence Extraction

Option A (preferred): Parse CONFIDENCE field from decision_frame thought content.
Option B (future): Add `confidence?: 'high' | 'medium' | 'low'` as a structured field on ThoughtData.

For MVP, use Option A. The operations mode template already instructs agents to include `CONFIDENCE: high|medium|low — calibration text` in decision frames.

### R2: Confidence Visualization

| Confidence | Badge Color | Icon |
|-----------|-------------|------|
| high | Green | Checkmark |
| medium | Yellow | Warning |
| low | Red | Alert |

Display on the decision_frame card (SPEC-AUD-001) and as a filter option in the timeline.

### R3: Critique Inline Display

When a thought has a `critique` object (`{ text, model, timestamp }`):
- Show a collapsible critique section below the thought
- If the next thought in the chain doesn't reference or address the critique, show a "critique not addressed" warning badge

### R4: Assumption Flip Timeline

Render `assumption_update` thoughts as a dedicated sub-timeline or overlay:
- Each flip shows: assumption text, old status → new status, trigger
- DOWNSTREAM field is rendered as links to the affected decision_frame thoughts
- Visual emphasis when status goes to "refuted" (red) vs "uncertain" (yellow)

### R5: Aggregate Confidence View

A session-level summary showing:
- Count of decisions at each confidence level
- Count of critiques generated vs addressed
- Count of assumption flips
- Any "red flags": low-confidence decisions that led to actions, unaddressed critiques

## Files to Modify

| File | Change |
|------|--------|
| `src/observatory/ui/*.html` | Confidence badges, critique inline, assumption timeline |
| `src/observatory/reasoning.ts` | Include critique data in thought events |
| `src/observatory/index.ts` | Aggregate confidence stats for session summary |

## Verification

1. Send decision_frames with varying confidence levels, verify badge colors
2. Send a thought with critique, verify inline display
3. Send assumption_updates, verify flip timeline renders
4. Verify downstream links navigate correctly
5. Verify aggregate view counts are accurate

## Dependencies

- SPEC-AUD-001 (decision_frame card rendering)
- Existing critique infrastructure (sampling loops)
- Operations mode assumption_update thoughtType (implemented)
