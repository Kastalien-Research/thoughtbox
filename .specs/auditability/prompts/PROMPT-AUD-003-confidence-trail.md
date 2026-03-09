# Implementation Prompt: SPEC-AUD-003 — Confidence Trail

You are implementing SPEC-AUD-003 for the Thoughtbox project. Your task is to surface confidence levels, critique results, and assumption flips as first-class visual elements in the Observatory UI.

## Context

Thoughtbox has a critique system (Phase 3: Sampling Loops) that stores critique results as `{ text, model, timestamp }` on ThoughtData. The operations mode instructs agents to include `CONFIDENCE: high|medium|low — calibration text` in decision_frame thoughts and to record assumption changes as `assumption_update` thoughts. None of this is currently visible in the Observatory. This spec makes it visible.

## What you must do

Complete these tasks in order. Do not skip steps.

### Step 1: Parse confidence from decision_frame content

This depends on SPEC-AUD-001's structured content parser. If that parser exists, use it. If not, write a simple regex extractor:

```typescript
function extractConfidence(thoughtContent: string): 'high' | 'medium' | 'low' | null {
  const match = thoughtContent.match(/CONFIDENCE:\s*(high|medium|low)/i);
  return match ? match[1].toLowerCase() as 'high' | 'medium' | 'low' : null;
}
```

### Step 2: Add confidence badges to the Observatory UI

Read `src/observatory/ui/observatory.html`. In the thought rendering code, when a thought has `thoughtType === 'decision_frame'`, extract the confidence level and render a colored badge:

| Level | Background | Text | Icon |
|-------|-----------|------|------|
| high | #22c55e (green) | white | ✓ |
| medium | #eab308 (yellow) | black | ⚠ |
| low | #ef4444 (red) | white | ✕ |

Place the badge next to the thought number or in the card header.

### Step 3: Surface critique results inline

Read `src/persistence/types.ts` — the `critique` field on ThoughtData is `{ text: string; model: string; timestamp: string }`. Read `src/observatory/emitter.ts` and verify whether critique data flows through to the UI.

In the Observatory rendering, when a thought has a `critique` object:
- Show a collapsible "Critique" section below the thought with the critique text and model name
- If the NEXT thought in the chain doesn't reference or modify the criticized point, show a yellow warning badge: "Critique not addressed"

### Step 4: Render assumption flip timeline

When `thoughtType === 'assumption_update'`, render a distinctive card showing:
- The assumption text
- A status arrow: OLD_STATUS → NEW_STATUS (e.g., "believed → refuted")
- Color the arrow: green for "→ believed", yellow for "→ uncertain", red for "→ refuted"
- TRIGGER text below
- DOWNSTREAM as clickable links to the referenced thought numbers

### Step 5: Add aggregate confidence summary

At the top of the session view in the Observatory, add a summary bar showing:
- Total decisions: N
- Confidence breakdown: N high / N medium / N low
- Critiques: N generated, N addressed, N unaddressed
- Assumption flips: N total

Calculate these by scanning all thoughts in the current session.

## Files you will modify

1. `src/observatory/ui/observatory.html` — Confidence badges, critique inline, assumption cards, summary bar
2. `src/observatory/emitter.ts` — Verify critique data flows through (may need to add it)
3. `src/observatory/schemas/thought.ts` — Add critique to ThoughtSchema if missing

## Files you must read first (do not skip)

1. `src/observatory/ui/observatory.html` — Current rendering
2. `src/observatory/emitter.ts` — Event emission, check if critique is included
3. `src/observatory/schemas/thought.ts` — Current schema
4. `src/persistence/types.ts` — ThoughtData critique field (lines 124-131)
5. `src/thought-handler.ts` — How critique results are attached (search for "critiqueResult")

## Constraints

- TypeScript strict mode, ES modules with `.js` extensions in imports
- Do NOT break rendering of thoughts without confidence/critique/assumption data
- The confidence parser must be lenient — if CONFIDENCE line is missing, show no badge (not an error)
- Keep observatory.html as a single file

## Verification

After implementation:
1. `npm run build:local` passes
2. Send decision_frames with CONFIDENCE: high, medium, and low — verify correct badge colors
3. Send a thought with critique enabled — verify critique section renders
4. Send assumption_update thoughts — verify status arrow renders with correct colors
5. Verify aggregate summary bar counts are accurate
6. Verify thoughts without these features render as before

## Reference

Full spec: `.specs/auditability/SPEC-AUD-003-confidence-trail.md`
GitHub Issue: #139
Branch: `feat/auditability-mvp`
Depends on: SPEC-AUD-001 (for structured content parsing)
