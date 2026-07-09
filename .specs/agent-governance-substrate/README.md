# Agent Governance Substrate — Research and Design Notes

**Status**: DRAFT / research artifact
**Source**: Thoughtbox session `316ec05c-e2c0-4960-8322-05caf9708736` (2026-04-20)
**Not for implementation without user approval.** This directory is the durable record of a research session, not a committed plan.

## Why this exists

Across months of attempts, governance interventions in this repo have consistently produced outcomes that are the **inverse** of what was intended — protocols get stripped during refactors, rules accumulate as artifacts while real invariants drift, instruction-layer enforcement rots. The user asked: why does this happen, how do other AI-heavy teams avoid it, and what should the minimum-viable response look like for a solo operator?

This research session surveyed the empirical practice of Anthropic (Claude Code), OpenAI (Codex Harness), Stripe (Minions), Factory AI (Missions), GitHub Copilot, and Sourcegraph Amp; grounded the findings in theory (Goodhart taxonomy, specification gaming, Letta sleep-time compute, Lehman's laws, Scott's legibility trap); dug into this repo's own git history to understand what was actually tried here; and produced a concrete path forward sized for one person.

## Contents

- **SPEC-SEVEN-LAYER-ARCHITECTURE.md** — The convergent architecture used by every successful AI-heavy team.
- **SPEC-THOUGHTBOX-SLEEP-TIME.md** — *removed in the 2026-07 demolition pass* (owner-approved sleep-time kill; the `process-thought-queue` edge function was undeployed). Was: Supabase-native proposal to adopt Letta's sleep-time compute pattern on pgmq + pg_cron. See git history for the full text.
- **SPEC-EVOLUTION-CHECK-GENERALIZED.md** — Generalize the existing `thoughtbox://prompts/evolution-check` pattern (A-Mem-based) from thoughts to skills, specs, rules, and memories. This is the mechanism by which governance moves from friction to search-space-narrowing.
- **STARTER-TIER-A.md** — The concrete starter actions sized for a solo operator. MVP is A1 (branch protection) + B5 (outbound claim truth layer), ~2 hours total.

## Core finding, 60 words

The user's observed pattern is predicted by Goodhart Adversarial and specification gaming. The defining property of successful teams' response is that **governance lives outside the agent-editable surface**. Every intervention this repo has attempted lived inside the repo, where agents can navigate and strip it. Moving governance to platform-level perms, CI gates, and sleep-time-agent memory updates breaks the inverse-outcome dynamic.

## Knowledge graph references

Persisted entities for cross-session retrieval:

- `seven-layer-stewardship-architecture` (`05768820-95be-4250-befc-66717c7e3aa5`)
- `enforcement-outside-agent-reach` (`c1368409-26f9-4ca1-b4a0-61578c020c78`)
- `goodhart-adversarial-in-agent-governance` (`271d3fa7-6d09-4f6f-b527-899682515fa4`)
- `multi-agent-fresh-context-review` (`fa4a10fc-3694-4bde-b637-40961b0242a0`)
- `rules-as-code-promotion` (`c6e542a0-9607-4760-813a-8651e2ccfbe4`)
- `tier-a-recommendations-solo-operator` (`61f5df79-c428-4874-9843-ff65d63e4aed`)
- `solo-operator-mvp-a1-b5` (`6e84f143-f095-4ac9-aa6e-0c72727e0933`)
- `inverse-outcome-mechanism-explained` (`828e493f-cfad-4e92-84bd-2ac9a9e8a5f9`)
- `thoughtbox-repo-governance-attempts-history` (`fda71b97-a1f1-4860-9d12-b7b0364cab71`)
- `context-engineering-as-code-discipline` (`0b434c6a-4892-465a-83ec-fb4f58ad7bd2`)
- `evolution-check-as-governance-substrate` (`c5519eaa-adf5-45a6-8c0e-693b97475bfb`)
- `letta-sleep-time-compute-reference-architecture` (`6d3e0bbb-0026-4279-8af8-f4416cdaa143`)

## Notebook artifacts

- **Stewardship Scorecard** (`pnlzgfld6mk`) — runnable notebook. Current state: 7 / 21 (33%). Biggest gap: L5 multi-agent adversarial review (0/3).
- **MVP Starter** (`jtl0qpq77i9`) — exported to `prototypes/stewardship-mvp-starter.src.md`. Generates Tier A checklist + branch protection script + CODEOWNERS file.

## Status disclaimer

These are research notes. Nothing here is accepted. Moving any of this into implementation requires the HDD process (staging ADR → validation → accept/reject). Cross-reference `AGENTS.md` and the `hdd` skill before committing to any of these directions.
