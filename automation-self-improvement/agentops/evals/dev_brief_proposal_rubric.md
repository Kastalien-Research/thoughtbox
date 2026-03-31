# Phase 1 Proposal Eval Rubric (Anti-Slop Filter)

## Purpose

Given a set of candidate proposals, select 2–3 that are:

- specific, testable, and implementable
- evidence-linked to signals + repo context
- aligned with Thoughtbox priorities
- safe enough for unattended execution (when REAL mode is enabled)

This rubric is designed to run automatically every day.

---

## Hard Gates (must pass, otherwise REJECT)

A proposal is REJECTED if any gate fails:

G0. Evidence links

- Must include >= 1 evidence URL from the daily signals input.
- URLs must be valid and from the provided inputs (no invented links).

G1. Touch points

- Must include >= 2 plausible file/dir touch points based on repo map.
- “src/*” or “agentops/evals/*” are acceptable, but must be specific enough to be actionable.

G2. Test plan

- Must include at least:
  - 1 unit test item
  - 1 integration test / scenario item
- Tests must relate to the proposed change (not generic “run tests”).

G3. Rollout + rollback

- Must describe a safe rollout strategy AND rollback plan.
- For risky surface-area changes: require feature flag / default-off behavior.

G4. Acceptance criteria

- Must include >= 2 objective acceptance criteria that are checkable.

If any gate fails: mark as REJECT with reasons.

---

## Red Flags (auto-downgrade or reject)

Any of the below triggers either REJECT or a large penalty:

R1. Vague verbs without mechanism

- “Improve”, “refactor”, “clean up”, “optimize”, “enhance”, “modernize”
  without concrete mechanism + target subsystem + measurable outcome.

R2. No measurable outcome

- “Better UX” with no defined success criteria.

R3. Unbounded scope

- touches many subsystems without a staged plan or a strict DoD.

R4. Evidence mismatch

- cites papers/news but proposal doesn’t connect to them concretely.

R5. Not repo-grounded

- proposes features that ignore current architecture/stage model/gateway constraints.

---

## Scoring Dimensions (0–5 each) and Weights

Total score is weighted to 100.

### D1. Specificity & Mechanism (weight 25)

0: hand-wavy idea
3: concrete change described, but fuzzy integration
5: crisp mechanism; names affected components; explains approach + edge cases

### D2. Evidence Quality (weight 15)

0: no evidence
3: evidence present but weakly connected
5: evidence clearly motivates proposal and matches scope/timing

### D3. Testability & Evaluation (weight 20)

0: no tests or non-specific tests
3: plausible tests but missing deterministic harness angle
5: deterministic tests + scenario/harness + regression framing

### D4. Impact / Leverage (weight 20)

0: cosmetic
3: useful but narrow
5: meaningfully improves compatibility/reliability/debuggability/velocity

### D5. Scope Control & Risk (weight 10)

0: risky and unbounded
3: some scoping, but ambiguous rollout
5: scoped, staged, flag/guard rails, safe failure modes

### D6. Implementation Feasibility (weight 10)

0: doesn’t map to repo / unclear
3: plausible but missing key integration details
5: clearly implementable within S/M effort; touch points align with approach

---

## Recommended Thresholds

- Minimum to be eligible: 80/100 AND pass all hard gates.
- If fewer than 2 proposals pass:
  - lower threshold to 70/100 ONLY IF the proposals are low-risk and heavily testable.
  - otherwise output fewer proposals and add `blocking_reason`.

---

## Tie-breakers (when multiple proposals qualify)

Prefer proposals that:

1) increase MCP client compatibility / progressive disclosure correctness
2) add deterministic evaluation harnesses
3) reduce debugging time in Observatory
4) are low/medium risk with staged rollout

Avoid always picking “docs-only” unless the signals strongly support it.

---

## Output Requirements for Each Scored Proposal

For each candidate, produce:

- score_total (0–100)
- pass_fail
- gate_failures (if any)
- scores by dimension
- 2–4 “fix suggestions” (targeted edits that would raise score)