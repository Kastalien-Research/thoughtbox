# Theseus Protocol: v0.2 Constitution

This document defines the evolution of the Theseus Protocol from a set of lexical heuristics into a **least-privilege reference monitor** for autonomous maintenance. It enforces safe exploration and adversarial accountability by substituting blind autonomy with bureaucratic friction and separation of powers.

---

## 1. The Test Visa (Semantic Lock)
The wholesale lock on `/tests/` must be refined to distinguish between structural test-migrations and behavioral rule changes.
- **Oracle Edits (Behavior-Adjacent):** Strict lock. Modifying assertions, expected values, removing cases, or altering golden files fundamentally changes what "pass" means. This is a behavior change, not a refactor, and is inadmissible.
- **Harness Edits (Structure-Adjacent):** Require a `test-migration` visa. Changes to imports, helper extraction, fixture rewiring, and mock setups are admissible provided they do not alter the Oracle.

## 2. Bidirectional Semantic Tollbooth
The tollbooth cannot rely on regex (e.g., blocking the word "and"). It must use a bidirectional LLM check to enforce atomicity:
1. **Infer Intent:** The Tollbooth evaluator is given *only* the diff and asked to infer the set of plausible intents (`intent_set`).
2. **Evaluate Narrative:** It checks if the commit message matches exactly ONE of those intents.
3. **Enforcement:** The checkpoint is rejected if `|intent_set| > 1` (diff contains multiple logical changes) or if the commit narrative contradicts the inferred intent. 

## 3. Structural Yield & Anti-Gaming Guardrails (Cassandra Audit)
Refactoring requires a definitive, machine-checkable standard of improvement to prevent justification collapse ("moving furniture"). 
- **Metric Extractors:** The agent must declare a specific Yield Metric (e.g., `narrowed-interface`, `reduced-fan-out`, `deleted-edges`).
- **Pre/Post Certificate:** Checkpoints must carry quantitative proof that the claimed metric improved.
- **Anti-Gaming Constraints:** Counter-metrics must stay within budget. The agent cannot successfully claim "reduced fan-out" by merely shoving complexity into a globally mutable state object. 

## 4. Epistemic Visas as Expiring Capabilities
A Visa is an exception, not a permanent widening of the operational frontier. Visas and Scope must remain structurally separate.
- **Scope:** Represents the thesis of the refactor.
- **Visa:** An attenuated, least-privilege authority token. It is granted with strict bounds: `{path/region, allowed_operations, max_diff_lines, expiry, reason}`. When the budget or expiry is exhausted, authority is revoked.

## 5. Architectural Enforcement (The Reference Monitor)
`theseus.sh` is a ledger and coordinator, not the Constitution. True enforcement must be un-bypassable.
- The real policy layer resides in the write mediator: either the `PreToolUse` shell hooks or the sandboxed file gateway within the MCP backend.
- The mediator must query Supabase to confirm active Visas or Scope before writing to disk.

## 6. Implementation Hardening
The shell implementation requires immediate fixes to guarantee state hygiene:
- **State Location:** Move state from `.theseus/` to `.git/theseus/` so it survives `git clean -fd`.
- **Pre-staged Contamination:** `git add <scope>` is dangerous if out-of-scope files were staged before the session began. Sessions should ideally execute inside ephemeral git worktrees.
- **False Successes:** Remove `git commit ... || true` which can silently bless failed checkpoints.

## 7. Dual Lanes (Surgical vs. Mechanical)
Refactoring atomicity has two distinct flavors that require different governance:
- **Surgical Refactoring Lane:** One small, locally justified change.
- **Mechanical Migration Lane:** Rule-based collateral evolutions across many files (e.g., codemods). In this mode, the object of review is the *transformation rule*, not the individual file outcome.

## 8. Evaluator Diversity 
To prevent "Maker’s Bias" (correlated blind spots), the Constitution requires separation of powers across model families. The generative Author, the Semantic Tollbooth, and the Cassandra Auditor should not be fulfilled by the exact same model series.
