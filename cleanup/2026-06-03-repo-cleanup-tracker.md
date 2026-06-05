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
3. The tracked DB originally contained extra tables beyond the archived
   `research-workflows-REINIT-PLEASE` schema/seed pair; canonical
   `research-workflows/schema.sql` and `seed.sql` now cover the reproducible
   model.
4. Tier 1 delete candidates from the audit are already absent on current `main`.
5. `package.json` no longer contains `start:stateful`, and `vitest.config.ts`
   carries no stale test include path.

## Branch execution log

| Branch | Scope | Status | Validation |
| --- | --- | --- | --- |
| `chore/repo-cleanup-tracker` | tracker/spec/plan bootstrap | completed | diff-check passed; JSON parse passed; repo PR validator blocked by missing `node_modules` |
| `chore/repo-cleanup-tier1` | safe-delete revalidation + stale config confirmation | completed | target paths absent; config drift already resolved on current `main` |
| `docs/repo-cleanup-authority-alignment` | docs/spec alignment | completed | README/spec indexes updated; stale loop claims removed; live spec prompts preserved |
| `chore/normalize-research-workflow-db` | reproducible research assets + DB untracking | completed | canonical schema/seed added; temp-db regeneration matches expected seed counts; tracked DB removed from git |
| `chore/repo-cleanup-archive-stale-work` | narrowed stale clusters archive/delete | completed | existence-check passed; JSON parse passed; diagnostics clean |
| `chore/remove-unsupported-agent-runtime-artifacts` | `.gemini/`, `.pi/`, local observability stack | completed | candidate paths already absent; current product observability surfaces preserved |
| `chore/repo-cleanup-branches` | local branch cleanup + remote candidate list | pending | pending |

## Deferred / follow-up items

- ADR renumbering or staging relocation may split from docs alignment if it
  grows beyond bounded cleanup.
- Remote branch deletion requires an explicit candidate list captured here.
- ADR governance cleanup is deferred from this docs branch to keep the authority
  alignment unit bounded.
- Additional stale-work deletions for `agentic-dev-team`, `self-improvement`,
  `src/multi-agent`, `.specs/old-specs`, `.specs/letta-specific`, and
  `thoughtbox-session-spec-pack` require more revalidation because current refs
  still exist.

## Validation log

- `git diff --cached --check` passed on `chore/repo-cleanup-tracker`.
- A Python JSON parse/assertion check passed for
  `prs/chore-repo-cleanup-tracker.json`.
- `pnpm validate:pr --branch chore/repo-cleanup-tracker` is currently blocked in
  this checkout because `tsx` is unavailable and `node_modules` is not present.
- Tier 1 revalidation confirmed the audit's delete-now file targets are already
  absent on current `main`.
- Tier 1 revalidation confirmed `package.json` has no `start:stateful` script
  and `vitest.config.ts` carries no stale test include path.
- Docs alignment validation confirmed the loop-embedding spec files,
  `scripts/embed-loops.ts`, and `src/resources/loops-content.ts` are absent,
  while `spec-designer`, `spec-validator`, `spec-orchestrator`, and
  `specification-suite` remain registered in `src/server-factory.ts`.
- Research-workflow normalization validation rebuilt a temporary SQLite database
  from `research-workflows/schema.sql` and `seed.sql`, yielding 11 workflows,
  52 workflow steps, and 6 attack-pattern seed rows with empty runtime-history
  tables.
- `research-workflows/workflows.db` is now removed from git tracking and remains
  ignored locally by the existing `*.db` rule.
- Stale-work revalidation showed that several broad audit delete targets are
  still referenced by control-plane artifacts or tests, so this branch deletes
  only the verified-disconnected subsets.
- Stale-work validation confirmed the selected files are removed, preserved
  clusters still exist, the PR description parses as JSON, and diagnostics are
  clean for the tracker, system map, and PR description.
- Unsupported-runtime validation confirmed `.gemini/`, `.pi/`,
  `docker-compose.observability.yml`, `monitoring/`, root `observability/`,
  root `grafana/`, root `prometheus.yml`, and root `otel-collector-config.yaml`
  are already absent. Current `src/observability`, `src/otel`, web
  observability docs/specs, and Supabase OTel migrations are not part of this
  unsupported local-stack delete target.
