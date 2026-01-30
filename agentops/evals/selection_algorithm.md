# Selection Algorithm: Candidate → Final 2–3

This is the critical “anti-slop” step. You get better results if your synthesizer produces more candidates than you publish, then you filter hard.

## Recommended Flow (works well in practice)

1. **Generate 5–8 candidate proposals**  
   Have the synthesizer produce 5–8 candidates (still in schema shape), not just 2–3.
2. **Run the evaluator rubric**  
   Score and gate each candidate.
3. **Select top 2–3 using constraints**
   1. Keep only `pass == true`.
   2. Sort by `score_total` descending.
   3. Apply a diversity constraint so you don’t get 3 variations of the same idea:
      - Max 1 proposal per category unless scores are very high (≥90).
      - Or require distinct primary subsystem touch points.
4. **If fewer than 2 pass**
   - Try one repair pass:
     - Feed failing candidates plus evaluator `fix_suggestions` to a repair prompt.
     - Re-evaluate.
     - If still <2 pass → publish fewer proposals with `blocking_reason`.
5. **Publish final 2–3**  
   Only the final set appears in the GitHub issue.

---

## Implementation Notes That Prevent “Rubric Theater”

### Deterministic checks first (cheap + reliable)

Before calling any evaluator model, do a pure code validation:

- Evidence URLs exist and are subset of signals.
- Touch points are non-empty and match `repo_map` patterns.
- Test plan contains at least one unit-ish line and one integration-ish line (simple keyword heuristics: unit, integration, scenario, harness, e2e).
- Acceptance criteria count ≥ 2.
- Rollout and rollback are non-empty.

This catches most slop without spending tokens.

### Make the evaluator “fail closed”

If the evaluator returns invalid JSON or missing fields:

- Re-run once.
- If still invalid → fall back to deterministic-only scoring and select conservatively, or publish `blocking_reason`.

### Add “reputation penalties”

If your system repeatedly emits proposals you reject manually, add a lightweight memory:

- Store rejected proposals and their failure reasons.
- Include a small “do-not-repeat patterns” section in the synthesizer prompt.

---

## Optional: Quick Scoring Math (for code)

If you implement weighted scoring:

- `specificity_mechanism` (0–5) → ×5
- `evidence_quality` (0–5) → ×3
- `testability_evaluation` (0–5) → ×4
- `impact_leverage` (0–5) → ×4
- `scope_risk` (0–5) → ×2
- `feasibility` (0–5) → ×2

Then:

```text
score_total =
  specificity*5 +
  evidence*3 +
  testability*4 +
  impact*4 +
  scope*2 +
  feasibility*2
```

Max = 25 + 15 + 20 + 20 + 10 + 10 = 100.

## What This Buys You

- The daily issue becomes consistently reviewable: each proposal is evidence-linked, repo-grounded, testable.
- You reduce proposal noise.
- You create a natural bridge into LangSmith eval dashboards: synthesizer run → evaluator run → final selection.