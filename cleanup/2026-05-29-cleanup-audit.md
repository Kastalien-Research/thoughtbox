# Thoughtbox Repo Cleanup — Initial Audit

**Date:** 2026-05-29
**Branch:** `chore/repo-cleanup` (off `main`)
**Method:** Six parallel read-only exploration agents traced wired-up vs. orphaned across
`src/`, `apps/web/`, assistant-config dirs, docs/specs/ADRs,
and build/infra/scripts. Every finding below was verified by reading imports, CI configs, and
git history — not inferred. **No files were modified during the audit.**

**Repo baseline:** 1,766 tracked files · 94 local branches (~49 already merged into `main`).

---

## The headline

The mess is **four distinct problems**, not one:

1. **Branch sprawl** — 94 local branches, ~49 already merged into `main`, plus auto-generated
   `worktree-agent-*` / `worktree-*` branches that violate AGENTS.md's no-auto-suffix rule.
2. **Agent-session detritus** — abandoned scratch from past agent runs, dumped both at root
   (`.agents/`, `.gemini/` mirror) and *inside the production web app* (`apps/web/.roo`,
   `.research`, `.gtm`, `.interleaved-thinking`, `pain/`, `reports/`, …).
3. **Pre-Code-Mode dead code** — when the 9 individual MCP tools were replaced by
   `search`+`execute`, the old per-tool schema files were left behind.
4. **Doc/spec rot** — README and CHANGELOG actively contradict the shipped architecture;
   orphaned spec indexes point to deleted files.

---

## Tier 1 — Delete now (high confidence, zero runtime risk)

| Item | What | Evidence |
|---|---|---|
| `src/operations-tool/`, `src/branch/tool.ts`, `src/hub/hub-tool-schema.ts`, `src/resources/notebook-export-pattern.ts` | Old flat-schema MCP tools | Imported by **nothing** (madge orphans); superseded by `code-mode/search-*.ts` |
| `scripts/staged-hooks/*` (9 files) | Pre-plugin hook system | Not wired in any settings; replaced by `plugins/thoughtbox-claude-code/hooks/` (2026-04-07 hooks rebuild) |
| `.claude/hooks/` — 3 of 5 scripts (`otlp_tool_capture.sh`, `protocol_gate.sh`, `session_tracker.sh`) | Dead hook copies | Not referenced in settings; live versions are in the plugin |
| `.roo/` (root), `.cursor/` contents, `.cursorignore` | Configs for unused tools | `.roo`/`.cursor` are gitignored & empty; Cursor/Roo not in use |
| `.agents/` (root, ~79 files **untracked, not gitignored**) | Orphan mirror of `.claude/skills` | Zero references in any doc; never committed — just sitting in the tree |
| `apps/web/.interleaved-thinking/` | Agent scratch (strategy.md, final-answer.md) | No references |
| `docs/2025-11-25.ts`, untracked `docs/session-run-current-state.md` | Stray files | Not imported anywhere |
| `otel-collector/config.yaml` (non-prometheus variant) | Dead config | Unreferenced; compose uses `config-with-prometheus.yaml` |

**Stale-script/config bug to fix while here:**

- `package.json` `start:stateful` → `node dist/http-stateful.js` — **there is no `src/http-stateful.ts`.** This script cannot work.

---

## Tier 2 — Archive (coherent work, but not wired into anything that runs)

Real design artifacts/prototypes, just disconnected. Recommend moving to an `archive/` dir or
git-tag-then-delete (git history keeps them recoverable either way).

- `prototypes/thought-processing-worker/` — self-contained prototype with its own lockfile, referenced by nothing.
- `apps/web/` cruft: `.research/`, `.gtm/`, `pain/`, `reports/`, `.specification-suite/`,
  `thoughtbox-session-spec-pack/`, `guides/` (superseded by `user-docs/`, which *is* wired), and
  root-level `GTM-PLAN.md` etc. — none touched by the app build.
- `src/multi-agent/` content-hash / claim-parser / conflict-detection / thought-diff
  (PR #96 feature, never wired). **Keep** `cipher-extension.ts` — that one *is* used.
- `.specs/old-specs/` (already self-quarantined), `.specs/letta-specific/` (DGM/Letta, oldest
  untouched cluster), Srcbook/Observatory drafts (`SPEC-SRC-*`, `SPEC-OBS-001`).
- `scripts/utils/verify-assumptions.ts` + `verify-assumptions.yml` (workflow is hard-disabled with `if: false`).

---

## Tier 3 — Needs your decision (do not guess)

1. **`.gemini/` (100 files)** — confirmed redundant mirror of `.claude`, but AGENTS.md cites it as
   the resolution-order fallback. Delete requires editing AGENTS.md in the same commit.
   *Is Gemini CLI still a supported runtime here?*
2. **`.pi/` (40 files)** — looks abandoned, **but** staging ADR-019 proposes `.pi/work.jsonl` as a
   future work-tracking store. *Is ADR-019 live or dead?*
3. **`observability/mcp-sidecar-observability/` + `otel-collector/` (~40 files)** — the single
   biggest dead-weight candidate. Production OTEL goes server-side into Supabase `otel_events`;
   this Prometheus/Grafana/sidecar stack is wired **only** in local `docker-compose.yml`, absent
   from Cloud Run and terraform. *Do you still run the local observability stack?*
4. **Filesystem storage backend** — `src/persistence/filesystem-storage.ts` + `migration.ts` are
   still actively wired in `index.ts`, but the 2026-03-19 decision was **Supabase-only, no
   dual-backend.** Live code contradicting the decided architecture. Biggest gratuitous *surface*
   in `src/`.
5. **`research-workflows/workflows.db`** — a 118 KB mutable SQLite binary committed to git
   (tracked despite a `*.db` ignore rule) and live-read by agent scripts. Will produce noisy diffs.
   Keep as seed but make read-only, or untrack and regenerate from the `*-REINIT-PLEASE/`
   schema+seed scripts.
6. **ADR governance** — `ADR-GCP-02` says "Accepted" but sits in `staging/`; ADR-013 and ADR-015
   are each used for two different decisions. Needs renumbering/relocating.

---

## Branches (mechanical, handle separately)

- ~49 branches already merged into `main` → safe to delete.
- `worktree-agent-*` / `worktree-*` branches are auto-generated cruft that violate AGENTS.md's
  no-auto-suffix rule.
- Exact `git branch -d` list + remote prune available on request.

---

## Doc fixes (small but they actively mislead)

- **README** still says *"Local-First: runs entirely on your machine, nothing leaves your
  network"* — flatly contradicts Cloud Run + Supabase. Fix the framing.
- **CHANGELOG `[Unreleased]`** advertises OODA-loops MCP resources and `spec-*` prompts whose
  source dir is gone. Remove them.
- **`.specs/README.md` + `IMPLEMENTATION-READY.md`** are indexes pointing to `loops-mcp-*.md`
  files that no longer exist. Rewrite or delete.

---

## Observatory / web-app convergence (noted, not acted on)

- `src/observatory/` (local-dev UI) is **live and reachable** from `index.ts`.
- `apps/web/` is the **production app**.
- They are genuinely separate trees today.
- **Convergence blocker found:** `apps/web/supabase/` carries 8 migrations that are
  **byte-for-byte identical** to the oldest 8 of root's 20 — a copy that will silently drift.
  Worth resolving as part of that conversation.

---

## Rough impact

Tier 1 + Tier 2 removes on the order of **250–300 files** without touching anything that runs.
The branch cleanup roughly halves the branch list.

---

## Per-zone agent findings (detail)

### `src/` (MCP server)
- Live entrypoints: `src/index.ts`, `src/server-factory.ts`, HTTP variants
  (`http/event-stream.ts`, `http/hub-http.ts`, `http/protocol-http.ts`).
- Post-Code-Mode tool surface registers only `thoughtbox_search`, `thoughtbox_execute`,
  `thoughtbox_peer_notebook`. The Mar-23 commit "replace 9 MCP tools with Code Mode" left the old
  per-tool schema files behind — source of most `src/` orphans.
- Verified-live-but-non-obvious: `audit/` (dynamic import in `thought-handler.ts`), `references/`
  (dynamic import in `sessions/handlers.ts`), `revision/`, `evaluation/`+`otel/`+`observatory/`.

### `apps/web/`
- Real app: `src/` (106 files) + config + `user-docs/` (wired into the `/docs/*` MDX routes via
  `src/lib/docs/load-doc.ts`) + `scripts/sync-db-types.sh` (wired to `db:types`).
- Cruft (no build/test/runtime reference): `.research/`, `.gtm/`, `pain/`, `reports/`,
  `.specification-suite/`, `thoughtbox-session-spec-pack/`, `.interleaved-thinking/`, `guides/`,
  plus the agent-config dirs `.agents/`, `.roo/`, `.claude/`, `.augment/`.
- `apps/web/.specs` and `apps/web/.adr` are **not** duplicates of root — distinct web-app content.

### Assistant-config dirs
- `.claude/` (132) — canonical, KEEP. Dead weight inside: `.claude/state/` (runtime cruft, untracked),
  3 unwired hook scripts, empty `.claude/agent-memory/` subdirs.
- `.gemini/` (100) — redundant mirror (strict subset of `.claude/skills`). ARCHIVE.
- `.codex/` — KEEP (step-2 authority in AGENTS.md; has unique `source-of-truth-preflight` skill).
  Note: several `.codex/` files are currently untracked/uncommitted.
- `.agents/` (root) — orphan mirror, untracked, zero references. DELETE.
- `.pi/` — Tier-3 decision (ADR-019 dependency).
- `.roo/`, `.cursor/` — gitignored/empty, unused. DELETE.

### Misc top-level dirs
- KEEP (live in CI): `research-workflows/workflows.db`, `prs/`.
- ARCHIVE: `prototypes/`, `todos/`.
- `temps/`, `logs/`, `.thoughtbox/` — already gitignored, no tracked files. Leave.

### Build/infra/scripts
- Orphaned scripts: `scripts/staged-hooks/*` (DELETE), `scripts/utils/verify-assumptions.ts`
  (disabled workflow), `scripts/sdk-implement.ts`, `scripts/thoughtbox-mcp-proxy.sh`,
  `scripts/utils/update-task-handoff.mjs` (ARCHIVE/confirm).
- OTEL/Prometheus/Grafana/sidecar stack is local-compose-only, absent from deploy → Tier-3 decision.
- Deploy configs are consistent: `cloud-run-service.yaml` = thoughtbox-mcp server;
  `infra/gcp/*.tf` = separate `agent-runner-job`. No contradictions.
- No GitHub Actions workflow deploys the Cloud Run server — Cloud Build does it out-of-band
  (consistent, just not visible in-repo).
