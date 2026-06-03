# Repo Cleanup Tracker

**Started:** 2026-06-03
**Spec:** `.specs/repo-cleanup/SPEC-REPO-CLEANUP-2026-06.md`
**Plan:** `cleanup/2026-06-03-repo-cleanup-plan.md`

## Accepted decisions

- Keep `.agents/`.
- Keep `FileSystemStorage`.
- Replace the tracked research workflow DB with reproducible text assets.
- Remove unsupported `.gemini/`, `.pi/`, and local observability stack assets.
- Clean local branches and remote-tracking refs automatically; generate an
  explicit remote deletion list before deleting remote branches.

## Known audit corrections

1. `.agents/` is referenced by current `AGENTS.md` and is not a Tier 1 delete.
2. `research-workflows/workflows.db` is tracked at the repo root path shown in
   the audit summary, despite `.gitignore` containing `*.db`.
3. The tracked DB contains extra tables beyond the archived
   `research-workflows-REINIT-PLEASE` schema/seed pair, so the binary is not yet
   fully reproducible.
4. Tier 1 delete candidates from the audit are already absent on current `main`.
5. `package.json` no longer contains `start:stateful`, and `vitest.config.ts`
   already points at `automation-self-improvement/agentops/tests/**/*.test.ts`.

## Branch execution log

| Branch | Scope | Status | Validation |
| --- | --- | --- | --- |
| `chore/repo-cleanup-tracker` | tracker/spec/plan bootstrap | completed | diff-check passed; JSON parse passed; repo PR validator blocked by missing `node_modules` |
| `chore/repo-cleanup-tier1` | safe-delete revalidation + stale config confirmation | completed | target paths absent; config drift already resolved on current `main` |
| `docs/repo-cleanup-authority-alignment` | docs/spec/governance alignment | pending | pending |
| `chore/normalize-research-workflow-db` | reproducible research assets + DB untracking | pending | pending |
| `chore/repo-cleanup-archive-stale-work` | stale clusters archive/delete | pending | pending |
| `chore/remove-unsupported-agent-runtime-artifacts` | `.gemini/`, `.pi/`, observability | pending | pending |
| `chore/repo-cleanup-branches` | local branch cleanup + remote candidate list | pending | pending |

## Deferred / follow-up items

- ADR renumbering or staging relocation may split from docs alignment if it
  grows beyond bounded cleanup.
- Remote branch deletion requires an explicit candidate list captured here.

## Validation log

- `git diff --cached --check` passed on `chore/repo-cleanup-tracker`.
- A Python JSON parse/assertion check passed for
  `prs/chore-repo-cleanup-tracker.json`.
- `pnpm validate:pr --branch chore/repo-cleanup-tracker` is currently blocked in
  this checkout because `tsx` is unavailable and `node_modules` is not present.
- Tier 1 revalidation confirmed the audit's delete-now file targets are already
  absent on current `main`.
- Tier 1 revalidation confirmed `package.json` has no `start:stateful` script
  and `vitest.config.ts` already includes
  `automation-self-improvement/agentops/tests/**/*.test.ts`.
