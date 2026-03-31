# Project Cleanup Catalog

Generated 2026-03-24. Audit of all top-level directories and files.

## Corrections

- `self-improvement/`, `agentic-dev-team/`, `agentops/`, `dgm-specs/` removed as part of unified autonomy control plane cleanup (2026-03-31).

## DELETE (no active references, no ongoing value)

| Item | What it is |
|------|-----------|
| `.dgm/` | Orphaned CycleQD state from earlier DGM design |
| `.docs-research/` | Gitignored research scratch (code-mode cipher, already shipped) |
| `.dolt/` | Empty Dolt database directory |
| `.doltcfg/` | Dolt config leftover with a misplaced `.claude/state/` file inside |
| `.eval/` | Unpopulated eval baselines (all sample_size=0) |
| `.letta/` | Stale Letta agent session reference |
| `.specification-suite/` | Superseded by `.specs/` and `.adr/`; crash lockfiles |
| `audit-demo/` | Vendored copy of `modelcontextprotocol/servers` for a one-time audit |
| `benchmarks/` | Moved to `dgm-specs/harness/`; residual |
| `code-review-comments/` | Disposable Greptile review dumps from past PRs |
| `infra/` | Committed runtime log dumps, no config or IaC |
| `logs/` | Hook telemetry + multi-MB transcript backups |
| `pain/` | Informal design notes predating current specs |
| `public/` | Single unreferenced screenshot PNG |
| `reports/` | Historical gap analysis; its own cleanup plan flagged `staging/` for deletion |
| `staging/` | Stray ADR (move to `.adr/staging/` first), then delete |
| `.DS_Store` | macOS metadata |
| `config.yaml` | Dolt SQL server config (conflicts with Supabase-only decision) |
| `llms-install.md` | Unreferenced install guide, superseded by README |
| `observatory-test.html` | 745-line standalone HTML scratch file |

### Pre-delete action

Move `staging/docs/adr/003-observatory-historical-sessions.md` to `.adr/staging/` before deleting `staging/`.

## ARCHIVE (has reference value, clutters the active project)

| Item | What it is |
|------|-----------|
| `.analysis/` | One-time forensic governance analysis from March 2026 |
| `ai_docs/` | Vendored external docs (arXiv, Claude SDK, LangSmith, MCP) |
| `demo/` | Docker-compose multi-agent demo; potential reuse for onboarding |
| `future-improvements/` | MPC controller bridge + plugin packaging proposals |
| `specs/` | Old-location specs; canonical is now `.specs/` |
| `tests/` | Excluded from vitest config; standalone scripts + behavioral spec docs |
| `cloud-run-service.yaml` | Hand-authored Knative manifest predating current deploy |
| `docker-compose.yml` | Dolt services conflict with Supabase-only; observability services may be salvageable |

### Note on `docs-staging/`

Contains WORKFLOW-v2.md and product vision. Promote to `docs/` rather than archive.

## KEEP (actively used)

| Item | Why |
|------|-----|
| `.adr/` | Live ADR store for HDD workflow |
| `.assumptions/` | Verified API behavior facts used by hooks |
| `.hdd/` | Runtime HDD state (ADR-015 in progress) |
| `.husky/` | Active pre-commit hooks |
| `.specs/` | Canonical spec directory |
| `.thoughtbox/` | Local filesystem storage for the MCP server |
| `docs/` | WORKFLOW-MASTER-DESCRIPTION.md is a live reference target |
| `observability/` | Grafana/Prometheus configs mounted by docker-compose |
| `otel-collector/` | OTEL configs mounted by docker-compose |
| `research-workflows/` | SQLite DB used by agent scripts |
| `scripts/` | CI workflows + npm scripts depend on it |
| `supabase/` | Active migrations and local dev config |
| `templates/` | Build-time template source for notebooks |
| All standard config files | package.json, tsconfig, vitest, oxlint, Dockerfile, etc. |
