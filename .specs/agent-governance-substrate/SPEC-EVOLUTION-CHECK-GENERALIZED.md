# SPEC: Evolution-Check Generalized — Governance as Search-Space Narrowing

**Status**: DRAFT — research artifact, not accepted
**Note (2026-07)**: References below to `SPEC-THOUGHTBOX-SLEEP-TIME.md` point at a spec removed in the demolition pass (owner-approved sleep-time kill; the `process-thought-queue` edge function was undeployed). Those implementation deltas are historical; see git history.
**Source session**: `316ec05c-e2c0-4960-8322-05caf9708736`
**Primary reference**: Thoughtbox resource `thoughtbox://prompts/evolution-check` (existing A-Mem-based pattern); A-Mem paper arXiv:2502.12110; Letta Skill Learning (Dec 2025); XSkill (arXiv 2603.12056v2).

## Thesis

The `thoughtbox://prompts/evolution-check` pattern — a cheap sub-agent that classifies which prior thoughts should be enriched when a new insight arrives — is the seed primitive for the governance reframe. Generalize it from thoughts to skills, specs, rules, and memories. When evidence accumulates, an async sub-agent re-classifies which adjacent governance artifacts should be updated. Governance becomes ambient adaptation rather than imposed friction.

The user's strategic framing: "governance out of friction category into search-space-narrowing at a given instantaneous point in time." This spec names the mechanism for exactly that shift.

## The existing primitive

From `thoughtbox://prompts/evolution-check` (resource on the Thoughtbox MCP):

1. A new thought is added with an insight.
2. A Haiku sub-agent evaluates each prior thought in the session against the new insight.
3. Sub-agent returns `UPDATE` or `NO_UPDATE` for each prior, with a brief reason.
4. Orchestrator applies `UPDATE` classifications by writing revision thoughts (`isRevision: true`, `revisesThought: <n>`).
5. Token cost ~50 tokens to main context vs ~800 for direct evaluation. Sub-agent pattern scales better than all-in-main-context.

**Demonstrated live in session `316ec05c`** at thoughts 111–115: a sub-agent classified six prior thoughts, returned three `UPDATE` classifications with reasons, and three revisions were applied. The pattern works as documented.

## The generalization

Same sub-agent classifier pattern, applied to different artifact classes:

### Thought evolution (existing)
- Triggered on: new thought added in an active session
- Classifies: prior thoughts in that session
- Updates: revision thoughts via `isRevision` flag
- Already shipped.

### Skill evolution (new)
- Triggered on: session close, or pattern-matched recurring behavior across sessions
- Classifies: existing `.claude/skills/<name>/SKILL.md` files that are adjacent to the session topic
- Updates: add observation to the skill's knowledge entity; open a GitHub PR proposing a patch to the SKILL.md
- Maps to: Letta Skill Learning (Dec 2025) — two-stage Reflection → Skill Update
- Implementation: see SPEC-THOUGHTBOX-SLEEP-TIME.md Delta 3

### Rule evolution (new)
- Triggered on: drift scanner detects rule-fire-rate anomaly (fires too often and always reverted, or never fires)
- Classifies: rules in `.agents/rules/` or `.claude/rules/`
- Updates: mark rule as `STALE` or `PROMOTE TO CODE` (rules that fire often but aren't structurally enforced are candidates for promotion to CI gates)

### Spec evolution (new)
- Triggered on: implementation diverges from spec (code review agent flags mismatch) or spec staging age exceeds threshold
- Classifies: specs in `.specs/` that are adjacent to the diverged implementation
- Updates: propose spec revisions, or move stale staging specs to `rejected/` with evidence

### Memory evolution (new — reinforces existing pattern)
- Triggered on: new observation contradicts or refines an existing memory entry
- Classifies: memory notes in `.claude/agent-memory/` and user's `MEMORY.md` index
- Updates: propose memory edits; remove stale entries

## Why generalizing works

The sub-agent classification pattern is domain-agnostic. It needs:

1. A set of candidate artifacts (prior thoughts / skills / rules / specs / memories).
2. A new piece of evidence (insight / trajectory / drift signal / observation).
3. A classifier prompt that produces compact UPDATE/NO_UPDATE decisions with reasons.

The classifier doesn't need to *apply* the update — it's a narrow relevance filter. The orchestrator reviews and applies. The cheap model can be wrong up to a threshold without catastrophic failure; the orchestrator is the second layer.

Per the A-Mem paper and the empirical Thoughtbox pattern: cheap classifier + human-reviewable recommendations + batched application is the right shape.

## Governance-as-search-space-narrowing

Traditional model of governance: rules are read at session start or written into instruction files. Agent maintains the rules in context, or ignores them. Surface grows monotonically. Drift.

Evolution-check model: artifacts in the governance graph are continuously re-ranked and enriched against incoming evidence. When an agent works at a specific location, the sleep-time substrate has already pre-filtered the relevant governance artifacts for that location. The agent receives *just the narrowed search space for this instant*, not the entire rulebook.

Consequences:

- Agents don't carry 2,500+ tokens of CLAUDE.md at session start; they carry 200–400 tokens of *location-relevant, recently-enriched* context at each decision.
- The enrichment happens in sleep time, not at request time — no latency cost to the primary agent.
- The search-space narrowing is *evidence-driven*, not author-declared. Rules that haven't surfaced in recent sessions decay in ranking; rules that recurrently matter rise.
- The user's repeated observation that "dozens of investigations haven't made a dent" gets an architectural answer: prior investigations produced artifacts (ADRs, specs, rules) but didn't produce the ranking mechanism that makes those artifacts ambient at decision time. Evolution-check IS that ranking mechanism.

## Immediate action — what to ship

### Step 1 — Use what already exists

The evolution-check prompt is already available at `thoughtbox://prompts/evolution-check`. Session `316ec05c` demonstrates it works. Before building anything new, adopt the pattern in manual Thoughtbox sessions for a week. Observe FP/FN rates on a small sample.

### Step 2 — Automate thought evolution in sleep-time

Delta 1 in SPEC-THOUGHTBOX-SLEEP-TIME.md: extend `process-thought-queue` to run evolution-check on every thought INSERT automatically. No more manual sub-agent invocation.

### Step 3 — Extend to skills

Delta 3 in SPEC-THOUGHTBOX-SLEEP-TIME.md: two-stage Reflection → Skill Update on session close. Same classifier pattern, different artifact class.

### Step 4 — Extend to rules and specs

Deferred. These are lower-leverage than skills because rules and specs change less frequently than sessions.

## FP/FN management

The classifier will be wrong some fraction of the time. Plan for it:

- Every `UPDATE` suggestion is human-reviewable before application.
- Track classifier precision over time. If < 80 % precision on a sample, re-prompt or swap models.
- Track classifier recall: did the classifier miss UPDATE opportunities that the user later manually flagged? If so, the prompt needs enrichment.
- Anti-goal: never let the classifier auto-apply destructive updates. Revisions are additive (new thought linked to old); skill PRs require human merge; rule changes go through the normal `.claude/rules/` CODEOWNERS gate.

## Relation to Goodhart

Evolution-check is not a proxy optimization target. It's a re-ranking mechanism. The proxy risk is: agents learn to write in a way that triggers `UPDATE` classifications on many prior thoughts (farming for enrichment activity). Counter: the classifier's prompt should reward *meaningful* enrichment, and the FP-rate tracking catches inflation. See SPEC-SEVEN-LAYER-ARCHITECTURE.md L5 for the general principle.

## References

- `thoughtbox://prompts/evolution-check` — the existing A-Mem primitive
- A-Mem paper: arXiv 2502.12110
- Letta Skill Learning: https://www.letta.com/blog/skill-learning
- XSkill (Experiences + Skills dual-stream): arXiv 2603.12056v2
- Knowledge entity: `evolution-check-as-governance-substrate` (`c5519eaa-adf5-45a6-8c0e-693b97475bfb`)
- Live demonstration: session `316ec05c` thoughts 111–115
