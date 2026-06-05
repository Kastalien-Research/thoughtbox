# Session Handoff — 2026-04-20

**Scope**: plugin ship (0.1.3 broken → 0.1.5 live) · comprehensive governance research · Supabase schema review · Letta sleep-time mapping · monorepo merge preparation · integration mapping · knowledge graph UI spec (Cytoscape, ported from user's Composio take-home).

**Primary goal for next session**: execute the monorepo merge of `thoughtbox-web-two` into `apps/web/`, then ship the Knowledge Graph UI as the first product differentiator on the merged repo. Framing: public announcement follows, not precedes, these.

**Thoughtbox research session**: `316ec05c-e2c0-4960-8322-05caf9708736` (116 thoughts, 3 revisions, closed). Retrievable via `tb.session.get("316ec05c-e2c0-4960-8322-05caf9708736")` or `tb.knowledge.queryGraph` starting from any of the entity IDs below.

---

## 1. What shipped today

### 1.1 Plugin 0.1.3 → 0.1.5

The 0.1.3 plugin (installed via `/plugin install thoughtbox-claude-code`) was broken for every user: `thoughtbox init --key <key>` called `GET https://mcp.kastalienresearch.ai/cli/validate`, which returned 404 because that endpoint was never implemented server-side. The user's working tree had already stripped the `validateApiKey` call (along with removing the `doctor` command entirely) but the changes were uncommitted.

Three PRs merged to fix this:

- **PR #265** — `fix(plugin): remove /cli/validate call that 404s on server`. Cut `validateApiKey`, removed the `doctor` command, deleted `hub-api-client.ts` + `profile-instructions.ts`, simplified event-client / event-filter / event-types to session-based routing with Bearer auth. Bumped to 0.1.4. Merged.
- **PR #266** — `docs(supabase): commit intelligence design doc and embedding smoke test`. Committed `supabase/SUPABASE-INTELLIGENCE.md` (untracked since Apr 7) and `supabase/functions/process-thought-queue/smoke_gte_small.ts`; removed `supabase/prototypes/thought-queue-processor/` (superseded). Merged.
- **PR #267** — `fix(plugin): drop doctor reference from init success output`. Replaced the stale `next: thoughtbox doctor` line with `next: restart your Claude Code session to load the Thoughtbox MCP server`. Bumped to 0.1.5. Merged.

User verified end-to-end in a separate repo that `thoughtbox init --key <key>` now produces the correct `.claude/settings.local.json` with `mcpServers.thoughtbox` + 5 OTEL env vars + a helpful next-step hint. Plugin ship = ✅ done.

### 1.2 Supabase infrastructure confirmed live

Verified via `supabase migrations list --linked` that all 17 shipped migrations are applied on the hosted project `akjccuoncxlvrrtkvtno` (project name: Thoughtbox). One migration is local-only (parked):

- `20260410163000_add_health_state_tables.sql` — the `workspace_setup_statuses` table for the now-cut `doctor` command. Parked on branch `defer/health-state-tables` (pushed, unmerged).

The Supabase intelligence pipeline from migration `20260408033928` is live on prod: `pgmq`, `pg_cron`, `pg_net` extensions; queues `thought_processing`, `entity_processing`, `session_closing`; triggers on thoughts + entities INSERT; RPC wrappers; Vault-backed cron invocation helper. Edge functions deployed:
- `process-thought-queue` — live, currently only broadcasts + archives
- `tb-branch` — deployed today (was in code, not yet in prod)

Branch parked (not merged): `defer/health-state-tables` at `18ef2de`.

### 1.3 Thoughtbox research session

Ran a structured research session at the user's request: "how do successful AI-heavy teams maintain governance invariants?" 116 thoughts across 6 phases. Session ID `316ec05c-e2c0-4960-8322-05caf9708736`, closed. The session was paired with a live demonstration of the `thoughtbox://prompts/evolution-check` pattern (Haiku sub-agent classifying which prior thoughts should be enriched when a new insight lands; applied three revisions on thoughts 87, 95, 110).

Research persisted as five specs at `.specs/agent-governance-substrate/`:

- **README.md** — index + 60-word core finding
- **SPEC-SEVEN-LAYER-ARCHITECTURE.md** — the convergent architecture used by Stripe, Anthropic Claude Code, OpenAI Codex, Factory AI, GitHub Copilot, Sourcegraph Amp, Letta
- **SPEC-THOUGHTBOX-SLEEP-TIME.md** — Supabase-native adoption of Letta sleep-time compute pattern using pgmq + pg_cron + edge functions
- **SPEC-EVOLUTION-CHECK-GENERALIZED.md** — generalize the existing evolution-check from thoughts to skills/rules/specs/memories — the "governance as search-space narrowing" mechanism
- **STARTER-TIER-A.md** — concrete actions sized for a solo operator; MVP = A1 (branch protection) + B5 (outbound claim truth layer)

Plus 12 knowledge-graph entities with 14 relations (ids enumerated in §4 below).

Plus two notebooks:
- **Stewardship Scorecard** (`pnlzgfld6mk`) — runs a 7-layer self-assessment; current state = 7/21 (33%); biggest gap is L5 multi-agent adversarial review (0/3)
- **MVP Starter** (`jtl0qpq77i9`) — generates the Tier A checklist markdown, `gh api` branch-protection script, and CODEOWNERS file; exported to `prototypes/stewardship-mvp-starter.src.md`

### 1.4 Integration mapping + Knowledge graph UI spec

Dispatched 3 subagents in parallel to map the Thoughtbox server ↔ web app integration:

1. Web app routes → Supabase usage
2. Supabase schema → writers/readers
3. Server capabilities → UI surfaces + docs

Synthesized into `.specs/monorepo-merge/INTEGRATION-MAP.md` (~17KB, 7 sections). The biggest finding: **the knowledge graph is entirely invisible in the web app** — `entities`, `observations`, `relations` are real, populated, queryable, but nothing reads them from the UI. This is the largest under-claimed capability in the product.

Drafted `.specs/monorepo-merge/SPEC-KNOWLEDGE-GRAPH-UI.md` to fill that gap. Cytoscape.js-based, verified against current docs (Context7 `/cytoscape/cytoscape.js`, `/plotly/react-cytoscapejs`, fCoSE v2.2.0 release notes). §12 is a direct port from the user's Composio dep-graph take-home found at `dep-graph/` — translation table, palette, per-type layout tuning, orphan detection (the ported "zero-producers" pattern), search + 1-hop neighborhood mode, three-column layout.

### 1.5 Monorepo preparation

User cloned `thoughtbox-web-two` into the repo root as a plain `git clone` (visible at `thoughtbox-web-two/` in the worktree). This is **not yet the merge** — it's a plain nested clone with its own `.git/` dir. The correct merge strategy is `git subtree add --prefix=apps/web` which preserves web app history. See §2 "What remains" for exact commands.

---

## 2. What remains to be done

Priority-ordered for the next session. Estimates are rough; real ranges depend on what blocks.

### Priority 1 — Monorepo merge (before anything else public-facing)

One PR, ~1 day of focused work:

1. `trash thoughtbox-web-two/` (the plain clone)
2. `git checkout -b chore/merge-web-app-monorepo` from up-to-date main
3. `git subtree add --prefix=apps/web https://github.com/Kastalien-Research/thoughtbox-web-two.git main`
4. Reconciliation tasks on the same branch:
   - Add or update root `pnpm-workspace.yaml` to include `apps/web`
   - Path-filter `.github/workflows/ci.yml` — web-only changes don't trigger server tests and vice versa
   - New workflow file for web app build/test (Vercel still owns deploys)
   - Update `.gitignore` for anything web-specific
   - Reconcile `apps/web/AGENTS.md` vs root `AGENTS.md` (likely: keep both, root describes server + hub, apps/web describes web conventions)
   - Add `CODEOWNERS` entries for `apps/web/**` if not already covered
5. Vercel operational cutover: point Vercel deploys at the new monorepo path instead of old repo
6. Archive old `thoughtbox-web-two` repo on GitHub (don't delete; keeps links resolving); add a README redirect to new location

**Why first**: every other item below assumes the web app is at `apps/web/`. Doing monorepo merge LATER means rewriting branch paths and PR instructions. Doing it FIRST is once-and-done.

### Priority 2 — Tier A governance (from the research, can land with or after the merge)

Quick wins that cost ~4 hours total and change the shape of drift risk:

- **A1** GitHub branch protection on `main` (10 min via repo settings UI or `gh api`)
- **A2** `.github/CODEOWNERS` requiring self-review on governance paths: `.claude/hooks/`, `.husky/`, `.github/workflows/`, `AGENTS.md`, `.adr/`, `.specs/`, `plugins/thoughtbox-claude-code/src/cli/`, `supabase/migrations/`, `apps/web/` (after merge)
- **A3** Delete accumulated zombie infra in working tree (see §3 Current state)
- **A4** Prune `AGENTS.md` + `CLAUDE.md` to ≤200 lines each; move depth into structured `docs/`
- **A5** GitHub Action that posts a claim-check on every PR (cross-reference PR description claims against actual diff)

**MVP-only shortcut**: if time is tight, just A1 + B5 (the outbound-claim truth layer) directly addresses the two most acute failures observed this week (strip-during-refactor + lying Discord ping). <2 hours total.

### Priority 3 — Knowledge Graph UI (Cytoscape port)

Per `SPEC-KNOWLEDGE-GRAPH-UI.md` — branch `feat/web-knowledge-graph` off post-merge main. ~600–900 lines, 8 files. Unblocks the "knowledge graph is invisible" finding from the integration map. First-public-announcement worthy.

Implementation sequence already in the spec §10:
1. Add deps (`cytoscape`, `react-cytoscapejs`, `cytoscape-fcose`)
2. Data layer (`graphQueries.ts` + `toCytoscapeElements.ts`)
3. Component (`KnowledgeGraph.tsx` — `'use client'`, fcose registered once at module scope)
4. Page (`page.tsx` server component)
5. Detail panel
6. Filters
7. Styling (port from Composio palette per §12)
8. Docs update — screenshot + link in `/docs/knowledge-graph`

**Nontrivial gotcha**: spec §12.10 lists deltas applied over §§1–11. Read §12 in full before implementing — the overrides (data-attribute selectors instead of classes, overlay selection, per-type layout functions, orphan detection) are load-bearing.

### Priority 4 — Thoughtbox Sleep-Time deltas

Per `SPEC-THOUGHTBOX-SLEEP-TIME.md`. First slice (~1 week focused):

- **Delta 1**: extend `supabase/functions/process-thought-queue/index.ts` to run evolution-check classification on every dequeued thought. Reads prior thoughts in session, calls Haiku via REST, writes revisions via `isRevision:true`. ~150–250 lines. Cost ~$0.001–0.005 per insert.
- **Delta 2**: add `trg_session_close_enqueue` trigger on `sessions` UPDATE (status → closed) + new `process-session-closing` edge function that runs `session.analyze` + `session.extractLearnings`.
- **Delta 4 minimal**: schedule `drift-scanner` via `pg_cron` + Vault (pattern exists in `invoke_process_thought_queue_from_vault` + `schedule_process_thought_queue`). Opens GitHub issues on stale ADRs.

**Not yet scheduled**: `SELECT public.schedule_process_thought_queue();` — this registers the existing helper as a cron job. It's a single SQL call and is the simplest possible "ship async pipeline" action. The infrastructure is entirely in place.

### Priority 5 — Other launch items

- **Pricing decision**: pick unit (thoughts? sessions? OTLP events?), tier structure (stay simple — one or two tiers), free-tier bounds. Open question per the integration map: current `/pricing`, `/billing` plans, and `/usage` entitlements are three conflicting sources of truth.
- **Minimum-viable public docs**: quickstart (one page, 30-second-to-value), "What is Thoughtbox" landing, pricing page. Everything else (MCP reference, architecture, cookbook) can land post-launch.
- **Soft launch** before HN post: curated audience (network, AI-coding Discord servers). Aim for 50–100 users through the install flow, then announce with usage data.

### Priority 6 — Cleanup housekeeping

Once monorepo merge lands:
- Merge or park `defer/health-state-tables` branch (currently pushed, unmerged). Decide: keep for possible web-app "workspace status" feature, or close and delete.
- Commit the research specs in `.specs/agent-governance-substrate/` as-is (they're research artifacts, not code changes — low merge risk).
- Commit the integration map + knowledge-graph spec at `.specs/monorepo-merge/`.
- Delete merged branches: `fix/plugin-cli-validate-404`, `docs/supabase-intelligence-record`, `fix/plugin-drop-doctor-reference` (already cleaned locally; verify remote).

---

## 3. Current state of the working tree

At session end, `git status` shows substantial unstaged / untracked content. **Don't panic** — most of this is accumulated research + governance output from this session, plus older in-progress work that predates this session.

**Research artifacts from this session (untracked, waiting on commit decision):**
- `.specs/agent-governance-substrate/` (5 files — research output)
- `.specs/monorepo-merge/INTEGRATION-MAP.md`
- `.specs/monorepo-merge/SPEC-KNOWLEDGE-GRAPH-UI.md`
- `.specs/monorepo-merge/SESSION-HANDOFF-2026-04-20.md` (this file)
- `prototypes/stewardship-mvp-starter.src.md`
- `dep-graph/` — user's Composio take-home; can stay or be moved to a separate location outside the repo

**Predates this session (not session's problem, just noise):**
- Various untracked accumulations in `.claude/agent-memory/`, `.claude/hooks/*.sh`, `.pi/`, `prototypes/`, `scripts/control-plane/`, `skills-lock.json`, etc. Most were catalogued in the research doc and recommended for Tier A pruning.

**Recent branches to clean up locally:**
- `fix/plugin-cli-validate-404` (merged, deleted locally)
- `docs/supabase-intelligence-record` (merged, deleted locally)
- `fix/plugin-drop-doctor-reference` (merged, deleted locally)
- `defer/health-state-tables` (pushed, NOT merged — parking branch for cut doctor work)

**Open PRs**: none.

---

## 4. Knowledge graph entities created this session

All public visibility, all retrievable via `tb.knowledge.getEntity` or `tb.knowledge.queryGraph`:

| Entity | ID | Type |
|---|---|---|
| `seven-layer-stewardship-architecture` | `05768820-95be-4250-befc-66717c7e3aa5` | Insight |
| `enforcement-outside-agent-reach` | `c1368409-26f9-4ca1-b4a0-61578c020c78` | Insight |
| `goodhart-adversarial-in-agent-governance` | `271d3fa7-6d09-4f6f-b527-899682515fa4` | Concept |
| `multi-agent-fresh-context-review` | `fa4a10fc-3694-4bde-b637-40961b0242a0` | Workflow |
| `rules-as-code-promotion` | `c6e542a0-9607-4760-813a-8651e2ccfbe4` | Workflow |
| `tier-a-recommendations-solo-operator` | `61f5df79-c428-4874-9843-ff65d63e4aed` | Decision |
| `solo-operator-mvp-a1-b5` | `6e84f143-f095-4ac9-aa6e-0c72727e0933` | Decision |
| `inverse-outcome-mechanism-explained` | `828e493f-cfad-4e92-84bd-2ac9a9e8a5f9` | Insight |
| `thoughtbox-repo-governance-attempts-history` | `fda71b97-a1f1-4860-9d12-b7b0364cab71` | Insight |
| `context-engineering-as-code-discipline` | `0b434c6a-4892-465a-83ec-fb4f58ad7bd2` | Concept |
| `evolution-check-as-governance-substrate` | `c5519eaa-adf5-45a6-8c0e-693b97475bfb` | Insight |
| `letta-sleep-time-compute-reference-architecture` | `6d3e0bbb-0026-4279-8af8-f4416cdaa143` | Concept |

Relation structure (`BUILDS_ON`, `EXTRACTED_FROM`, `APPLIED_IN`, `RELATES_TO`, `DEPENDS_ON`):
- `seven-layer` **BUILDS_ON** `enforcement-outside-agent-reach`, **DEPENDS_ON** `multi-agent-fresh-context-review`, **DEPENDS_ON** `rules-as-code-promotion`
- `enforcement-outside-agent-reach` **BUILDS_ON** `goodhart-adversarial-in-agent-governance`
- `inverse-outcome-mechanism-explained` **BUILDS_ON** `goodhart-adversarial-in-agent-governance`, **APPLIED_IN** `thoughtbox-repo-governance-attempts-history`
- `multi-agent-fresh-context-review` **RELATES_TO** `goodhart-adversarial-in-agent-governance`
- `rules-as-code-promotion` **APPLIED_IN** `thoughtbox-repo-governance-attempts-history`
- `tier-a-recommendations-solo-operator` **EXTRACTED_FROM** `seven-layer-stewardship-architecture`
- `solo-operator-mvp-a1-b5` **EXTRACTED_FROM** `tier-a-recommendations-solo-operator`, **RELATES_TO** `inverse-outcome-mechanism-explained`
- `context-engineering-as-code-discipline` **RELATES_TO** `rules-as-code-promotion`
- `evolution-check-as-governance-substrate` **BUILDS_ON** `seven-layer-stewardship-architecture`
- `letta-sleep-time-compute-reference-architecture` **BUILDS_ON** `evolution-check-as-governance-substrate`, **EXTRACTED_FROM** `seven-layer-stewardship-architecture`

The cleanest single-query way to load everything: `tb.knowledge.queryGraph({ start_entity_id: "05768820-95be-4250-befc-66717c7e3aa5", max_depth: 3 })`.

---

## 5. Open questions / decisions pending

None of these are urgent, but each will come up.

1. **Plan structure for launch**: current state has `/pricing` (free/pro/team copy), `PLAN_CONFIG` in `/billing`, `/usage` hardcoded to "Founding Beta unlimited", and Stripe webhook writing a `plan_id` nothing reads. Pick one, enforce it.
2. **Self-host posture**: hosted-only or open-sourced self-hosted option? Affects docs, pricing, marketing.
3. **Public-launch framing**: "agent reasoning substrate that runs while you sleep" — landing page lead-in. Ok to use or wants different framing?
4. **Health-state cluster fate**: parked on `defer/health-state-tables`. Does the web app want a "workspace health" display for users (reviving the cut doctor feature server-side only)? If not, close the branch.
5. **Dep-graph directory**: user's Composio take-home is at `dep-graph/`. Should it stay in the repo as reference material, or move to a gist / separate repo? Recommend: move to a gist, link from `SPEC-KNOWLEDGE-GRAPH-UI.md §12.11`.
6. **hub_* tables** (hub_events, hub_tasks, hub_workers): present in schema since migration `20260409232440`, zero writers, zero readers. Either ship a consumer or move back to `.specs/` as deferred. Integration map flagged this.
7. **Entity/session queues without consumers**: `entity_processing` queue has a trigger enqueueing messages, no edge function drains them. Pile-up. Either ship a worker or disable the trigger.
8. **Embeddings**: `SUPABASE-INTELLIGENCE.md` spec includes embedding columns on `thoughts`, `knowledge_entities`, `knowledge_observations`. Not yet in schema. Needed before semantic search and relevance-ranked evolution-check. Smoke test for `gte-small` already committed in `supabase/functions/process-thought-queue/smoke_gte_small.ts`.

---

## 6. Context for the next agent — how to pick up hot

**Recommended opening moves in the next chat**:

1. **Read this handoff first** — `cat .specs/handoffs/2026-04-20-plugin-ship-to-monorepo-prep.md`
2. **Read the three primary deliverables from this session**:
   - `.specs/monorepo-merge/INTEGRATION-MAP.md` (how the system is wired)
   - `.specs/monorepo-merge/SPEC-KNOWLEDGE-GRAPH-UI.md` (the first feature to ship on the merged repo)
   - `.specs/agent-governance-substrate/README.md` + its children (the broader stewardship direction)
3. **Check the Thoughtbox session**: `tb.session.get("316ec05c-e2c0-4960-8322-05caf9708736")` or `tb.knowledge.queryGraph` starting from any entity ID in §4 for the reasoning trail.
4. **Verify current working-tree state** per §3 before committing anything — lots of accumulated untracked content.
5. **Verify open PRs** via `gh pr list --state open` — should be zero at session start.

### Gotchas observed during this session (don't re-learn them)

- **Never commit directly to main.** `.husky/pre-commit` hard-blocks this but the friction still wastes time. Branch first.
- **`supabase db execute` doesn't exist.** SQL against the linked project needs either `supabase migrations list` / `supabase db pull` (read-only introspection) or a direct `psql` with a fetched connection string. User has service role key in `.env`; no Postgres password stored locally.
- **`supabase functions deploy` from the plugin dir errors** because config.toml there conflicts. Run from repo root with `--project-ref akjccuoncxlvrrtkvtno`.
- **The Thoughtbox MCP server returns "Server not initialized" after plugin reloads.** Only fix is a full Claude Code session restart. Budget a session break between `/plugin update` and any heavy MCP use.
- **`git stash --include-untracked` with a pathspec filter may partially fail** if some pathspecs don't match. Check the stash contents with `git stash show --only-untracked stash@{0}` before proceeding. (This session we lost the `.specs/agent-governance-substrate/` files temporarily and recovered them via stash pop.)
- **`rm -rf` is blocked**; use `trash` (macOS) or `git rm` for tracked files.

### Things to explicitly avoid

- **Don't add new workflow protocols.** Repo already has HDD, Theseus, Ulysses, Delphi. Research finding: the governance layer that works is OUT of the repo, not more process inside it. Ship closing loops for existing protocols before inventing new ones.
- **Don't rewrite AGENTS.md or CLAUDE.md from scratch.** Every past rewrite has been a drift opportunity. Prune in place per Tier A.
- **Don't commit the plain `thoughtbox-web-two/` clone** as-is. It's meant to be removed and re-added via `git subtree add`.
- **Don't invent a fifth epistemic protocol** just because the research made protocols feel under-integrated. The direction is fewer-but-enforced, not more.

### User preferences that came up this session

- Prefers Exa AI (`mcp__exa__web_search_exa`) over `WebSearch` for web queries.
- Conventional Commits format is REQUIRED (per project `CLAUDE.md`). Subject ≤72 chars, types: `feat|fix|perf|refactor|docs|test|chore|security`, `breaking` or `!` for breaking changes.
- Never squash-merge. Always merge commits.
- Prefers agent-first architecture — any user-achievable outcome must also be agent-achievable.
- Brutalist warm aesthetic is live in web app (`#f6f3ee` bg, `#201812` ink). Match this palette in Knowledge Graph UI.
- Favors the monorepo. Never argues against monorepo.
- Wants governance moved out of friction category into search-space-narrowing category. This framing is the product direction, not just a research artifact.

---

## 7. Product strategic framing (from today's conversation)

The user's product vision clarified substantially during this session. Useful to carry forward:

- **Thoughtbox is the agent reasoning substrate that runs while you sleep.** Model-agnostic. Runs on Supabase. Any MCP-compatible harness plugs in as the primary agent.
- **Differentiation vs Letta**: Letta bundles primary + sleep-time agents inside a single runtime. Thoughtbox Sleep-Time runs behind *any* agent harness the user already loves. Less lock-in.
- **Differentiation vs Cursor / Cody / Continue**: those are in-IDE assistants. Thoughtbox persists and evolves memory across sessions, surfaces governance as search-space narrowing, and has a growing knowledge graph layer.
- **Moat candidate**: the evolution-check + skill-reflection pattern (from `SPEC-EVOLUTION-CHECK-GENERALIZED.md`) is defensible technical work with a clear product story. Current infrastructure (pgmq + pg_cron + edge functions) makes it shippable as a first slice in ~1 week.

---

## 8. One-liner for the next session opener

> "Pick up where we left off on 2026-04-20 — plugin 0.1.5 is live, governance research is documented, next move is the monorepo merge of `thoughtbox-web-two` into `apps/web/` via `git subtree add`, then the Knowledge Graph UI per `.specs/monorepo-merge/SPEC-KNOWLEDGE-GRAPH-UI.md`. Handoff at `.specs/handoffs/2026-04-20-plugin-ship-to-monorepo-prep.md`."
