# Repo Cleanup Execution Plan

**Date:** 2026-06-03
**Spec:** `.specs/repo-cleanup/SPEC-REPO-CLEANUP-2026-06.md`
**Source audit:** `cleanup/2026-05-29-cleanup-audit.md`

## Approved decisions

- Keep `FileSystemStorage` for this cleanup series.
- Normalize `research-workflows/` from text assets; do not keep the tracked DB
  as the authoritative seed artifact.
- Use a shadow tracker at `cleanup/2026-06-03-repo-cleanup-tracker.md`.
- `.gemini/`, `.pi/`, and the local observability stack are unsupported and may
  be removed with reference updates.
- Remote branch deletion is allowed only from an explicit candidate list.

## Execution order

0. `chore/repo-cleanup-tracker` — create tracker/spec/workflow artifacts.
1. `chore/repo-cleanup-tier1` — safe deletes + stale config fixes.
2. `docs/repo-cleanup-authority-alignment` — docs/spec/governance alignment.
3. `chore/normalize-research-workflow-db` — move authoritative research assets
   under `research-workflows/` and untrack the DB.
4. `chore/repo-cleanup-archive-stale-work` — archive/delete stale coherent
   prototype and detritus clusters.
5. `chore/remove-unsupported-agent-runtime-artifacts` — remove `.gemini/`,
   `.pi/`, and local observability surfaces.
6. `chore/repo-cleanup-branches` — local branch cleanup, remote-tracking prune,
   and explicit remote deletion list.

## Guardrails

- Revalidate every delete target at edit time.
- Keep `.agents/`; the audit's delete recommendation is stale.
- Keep `FileSystemStorage`; removal is a larger product decision.
- Do not proceed with remote branch deletions from memory; generate the list
  from the current repository state.

## Validation defaults

- Prefer the smallest relevant test/build command for each branch.
- Record validation results in the tracker.
- If a validation failure reveals plan-changing scope, update the tracker before
  continuing.
