# SPEC: Environmental Learning Gates — Promotion/Demotion Criteria for Learned Constraints

**Status**: DRAFT — research artifact, not accepted
**Source session**: `1559e591-c9e2-4628-a0a9-e3a27e3c9ed4` (Thoughtbox, production `thoughtbox-cloud-run`, 16 thoughts)
**Adjacent specs**: `SPEC-EVOLUTION-CHECK-GENERALIZED.md` (governance as search-space narrowing), `SPEC-SEVEN-LAYER-ARCHITECTURE.md`, `SPEC-THOUGHTBOX-SLEEP-TIME.md`
**Provenance note**: Authored from a live design conversation in which the Ulysses protocol was exercised end-to-end against the production server (resolved cycle + full failure/recovery cycle). That run surfaced a concrete instance of the problem this spec addresses — `ulysses.plan` records `forbidden_moves` but does not enforce them (advisory only), confirmed in `src/protocol/handler.ts`. The question "when should a recorded constraint gain teeth?" is the subject of this spec.

## Thesis

If Thoughtbox becomes the **sole interface** to an agent's permission domain (the agent acts only through a small, whitelisted vocabulary of Thoughtbox operations — no native bash/edit), then the environment, not the model weights, is where in-deployment learning happens. At session end the environment can cheaply try to make a bad surprise less likely or a good surprise more likely next time. The mechanism for that is a small set of **learned constraints** attached to the gate vocabulary, each of which can carry more or less enforcement.

The hard part is not the gate mechanism. It is the **control policy that decides when a learned constraint gains teeth (promotion) and loses them (demotion/retirement)**. That policy is the actual product, and it is bounded by two opposing failure modes:

- **Under-gating** — real recurring harms stay toothless; the environment never actually learns; surprises recur.
- **Over-gating** — stale or false-positive constraints accumulate until legitimate work is choked. (The "donkey suffocates under too much dirt.")

This spec records the criteria framework for that policy.

## Forms (the vocabulary of teeth)

There are two forms, on one spectrum sorted by where the burden sits and how deterministic the rule is. Natural-language memory is **not** a third peer form — it is the toothless bottom rung (a "verdict" that is always-on and enforces nothing, so the agent carries all of the burden).

| Form | Behavior | Burden | Use |
|------|----------|--------|-----|
| **Validator / advisory** | Detects condition, surfaces a binary verdict + pointer to the issue, but **allows** the action | Shared (env computes, agent interprets) | Quality-within-the-boundary; reversible harm |
| **Gate** | Detects condition and **blocks** the action (variant: route to principal for approval) | None on agent (env enforces) | The permission boundary; irreversible/categorical harm |

The validator form's output — `{ pass, reason, evidence }`, pinned by sha256 — is **identical to the Ulysses validator-cell contract already shipped** (`src/notebook/validator.ts`, exercised live in production). The soft-tier mechanism exists; the missing work is generating such a cell from a session-end surprise and attaching it to an action, rather than authoring it by hand for a debugging session.

## Keystone insight: gates are information-destroying

The single most load-bearing finding. The moment you hard-block an action, you stop observing what *would* have happened if it ran, so you can no longer measure whether the rule is still correct. A gate's precision **freezes** at the instant of promotion; the world drifts (APIs become supported, the codebase changes, the once-dangerous becomes routine); the gate ossifies silently with no feedback channel to notice.

A **validator** warns-but-allows, so it keeps emitting harm/benign labels and stays self-correcting. This is the explore/exploit problem from reinforcement learning: a greedy policy that stops exploring cannot discover that its policy went stale.

Almost every criterion below is downstream of taking this seriously.

## Signals available per learned constraint `L`

`L` is attached to a detectable condition + action.

- **Counters**: `fires` (condition detected), `proceeded` (acted despite advisory), `heeded` (changed course).
- **Outcome-linked**: `harm_when_proceeded` (→ confirmed bad surprise), `benign_when_proceeded` (→ no harm; the false-positive evidence).
- **Derived statistics**: `precision = P(harm | condition ∧ proceeded)`; `fp_rate = P(action_was_legitimate | condition)`.
- **Context**: `severity`, and especially **reversibility** of the harm; **variance** of the correct response across contexts; recency/dormancy; **provenance** (boundary-violation vs quality-issue); **expressibility** (can the condition be written as a precise predicate at all?).

Note: `precision` and `fp_rate` require observing what happens when the agent **proceeds** — i.e. they require *not* blocking. This is the same fact as the keystone insight, restated as a data dependency.

## Promotion criteria

Promote (advisory → validator → gate) when:

1. **Recurrence** above a confidence floor (one occurrence ≠ a rule).
2. **High, stable precision** — proceeding-despite-the-condition reliably yields harm, and the correct response is **low-variance** across contexts. High variance ⇒ a categorical block manufactures false positives by construction.
3. **Net benefit**: `ExpectedHarmAverted > ExpectedFalsePositiveCost × safety_margin`, where
   `EHA = P(harm|condition) × severity × fire_rate` and
   `EFPC = P(legit|condition) × cost_of_blocking_legit × fire_rate`.

**Rung is selected by reversibility, not confidence** (the key reframe):

- **Reversible harm caps at VALIDATOR** no matter how high precision climbs — keep allowing-and-observing to stay calibrated; only the validator's *teeth* (loudness, required acknowledgement) escalate.
- **Only irreversible/categorical harm is eligible for a GATE** — the one case where you cannot afford the counterfactual.
- **Boundary/permission violations skip the ladder** — born as gates (variance ≈ 0, defined by the authorized domain). Thoughtbox already carries the selector primitive: `ulysses.plan`'s `irreversible: boolean`.

Consequence: most quality lessons should live *and die* as validators and never become gates.

## Shadow gates (dissolves the central tension)

The dilemma: you cannot safely promote to a gate without precision data, but gating destroys that data. Resolution — promote first into **shadow mode**:

- The predicate evaluates on every matching action and records "I *would* have blocked this," but **allows** the action and observes the real outcome.
- Over a shadow window you directly measure would-block-and-harm-followed (true positives) vs would-block-but-benign (false positives), *without going blind*.
- Only a shadow gate with `fp_rate` under budget **and** real harm-prevention gets **activated** to a live block.
- Shadow mode gives the human-in-the-loop approval step a concrete object: "this shadow gate would have blocked N actions, M genuinely harmful, 0 false positives over 30 days — activate?"
- It is also the natural **probation** state for demotion: relax a suspect live gate back to shadow to re-measure before retiring.

One primitive (shadow mode) serves cold-start, evidence-based promotion, and demotion re-evaluation.

## Demotion / retirement criteria

- **FP-rate breach** at a separate, lower, hysteretic threshold (promote high / demote low / dead zone between → no flapping; asymmetric by severity: irreversible rules promote eagerly and demote reluctantly, annoyance rules the reverse).
- **Staleness → demote, don't delete.** A non-firing gate is ambiguous: obsolete, or a *working deterrent* (nothing hits it precisely because it deters). Never silently delete on age; drop to a validator to regain the label stream and decide its fate.
- **Supersession** by a more precise rule; **source-fix** (cause removed upstream → gate redundant).
- Validators can self-demote (they keep emitting labels). **Gates cannot self-demote** (they killed their evidence stream) — demotion must come from outside: principal overrides, scheduled probation (shadow), or corroborating outcome signals.

## Systemic safeguard: a global friction budget

Per-rule demotion is necessary but not sufficient — every gate can look locally justified while their **sum** strangles the agent. Add a conservation law:

- Track the aggregate rate at which **legitimate** actions are blocked across all gates (`legit_block_rate`).
- Set a friction budget — a ceiling on acceptable obstruction of legitimate work.
- At/over budget, promotion becomes **zero-sum**: you may not add or strengthen a gate without demoting/retiring one of equal-or-greater friction.

This makes over-gating self-limiting structurally (not by vigilance), and the gate set churns toward relevance instead of monotonically accreting. Mirrors the cost-governor pattern: a hard ceiling beats advisory limits.

## Label provenance (the policy is only as good as its labels)

Every criterion is a function of "did harm actually occur?" and "was the blocked action actually legitimate?" Ranked:

1. **Outcome-grounded** — a downstream deterministic check fails (test breaks, deploy rolls back, later validator fails, commit reverted). Gold standard; cheap; hard to fake.
2. **Principal** — the human reverses a block or flags a surprise. High quality; sparse; expensive.
3. **Agent self-report** — weakest; the exact dependency we are removing; a prior only, never ground truth.

The structural payoff of the sole gate: the **same trace** that mediates an action also captures the downstream outcome that labels it. The gate is simultaneously the sensor and the actuator — actions generate the labels that tune the constraints that govern the actions. Without the gate, action and consequence are observed in different places and cannot be joined; with it, the join is free. **This is what makes outcome-grounded labeling possible at all.**

## The grain problem

Promotion/demotion presupposes the constraint is stated at the right level of abstraction.

- Too **specific** → the condition never fires again; it can never accumulate evidence; it clutters memory.
- Too **general** → it fires constantly with terrible precision; guaranteed false positives; starves the budget.

Before promotion criteria apply, generalize: find the **coarsest predicate that still holds precision** — widen the condition until precision starts to drop, then stop (learnable from the same label stream). The sole-gate vocabulary helps: because every action flows through a small set of typed operations, constraints attach at the **operation boundary** (per-operation, per-argument-pattern) — a sane default grain. The gate vocabulary is doing double duty: the action surface *and* the addressing scheme / default granularity for learned constraints.

## Structural unification: a constraint is an evidence-gated state machine

States: `PROPOSED → SHADOW → ADVISORY → VALIDATOR → GATE`, with reverse edges (`GATE → SHADOW` probation, `VALIDATOR → ADVISORY → RETIRED`). Each transition is guarded by a predicate over accumulated label statistics; those guards are exactly the promotion/demotion criteria above.

This is **self-similar to the Ulysses S-machine**. The gate vocabulary, the Ulysses validator cell, and the lesson lifecycle are three instances of one primitive — an *evidence-gated state machine* — at three scales (one action, one session, one constraint's whole life). Build that primitive once and the learning loop is mostly configuration over it, not new machinery.

## Who watches the watcher

The promotion/demotion policy is itself a learned controller and can fail in two dangerous ways:

- **Capture**: if the agent's behavior influences the labels (e.g. it learns that avoiding a condition keeps an advisory weak), the loop is gameable. Mitigate by preferring agent-uncontrollable outcome-grounded labels and treating suspiciously clean label streams as a red flag, not success.
- **Confident-but-wrong auto-promotion to an irreversible gate**: because gates are information-destroying, a wrongly-promoted gate is the hardest to detect and undo — it blocks legitimate work with no counter-evidence accruing.

Therefore: **everything reversible may run autonomously; promotion to an irreversible gate must require a second source** (principal approval or a corroborating outcome-grounded signal), never advisory→gate on the policy's say-so alone. You only go blind deliberately, never automatically.

## Strategic conclusion

**Adoption-by-gate and learning-by-environment are the same mechanism seen from two sides.** Making the agent act *only* through Thoughtbox is simultaneously (a) how you get the agent to use it (you remove the other buttons; it isn't a choice) and (b) how Thoughtbox is able to learn from what the agent did (action and outcome join at one chokepoint). The sole interface is not two goals; it is one mechanism. That identity is the thesis worth building around.

The donkey does not suffocate because we are careful; it doesn't suffocate because the system *structurally prefers the rung that keeps its eyes open* (validators over gates) and enforces a friction budget that makes gate-space zero-sum.

## Open questions / next design work

- **Exact transition guards.** The state-machine edges above need concrete thresholds (confidence floor, precision bar, FP-breach bar, friction-budget ceiling, shadow-window length). These are policy and should themselves be tunable/learnable.
- **Generation step.** How does the session-end loop *author* a candidate predicate from a surprise (the credit-assignment problem)? Diffuse surprises that don't reduce to a predicate stay permanently in the advisory/NL layer — a large set by count.
- **Where constraints live.** Storage + retrieval/ranking of constraints at each gate (the salience problem localizes inside each operation boundary but does not disappear).
- **Relation to weight learning.** The labeled traces this loop produces are also the dataset for later RL/fine-tuning. Environmental learning and weight learning are not opposed; the gate feeds both.

## Concrete near-term wedge (from the broader conversation)

Do not start with a new protocol or LSP integration. Prove the thesis where the harness is fully controlled (Claude Code): a **hook-based interception layer** that routes actions through Thoughtbox for gating + durable action-memory (the repo's existing `.claude/hooks/` already demonstrate action interception), plus a few genuinely-abstracted MCP action "buttons." Position Thoughtbox as the **universal remote's firmware** — the policy/memory/gating brain the harness delegates to — not as a replacement set of buttons that duplicates what harnesses already do.
