
## Scope

This file is authoritative for the MCP server, plugin, hub, and repo-level tooling. For web app conventions (Next.js 15 app under `apps/web/`), see `apps/web/AGENTS.md`.

## Development Workflow (Source of Truth)

Every unit of work runs through a mandatory skill. Two additional protocols activate conditionally.

### Mandatory Skills

**`workflow`** — Full development lifecycle from ideation through merge. Stage 2 produces or updates `.specs/` markdown with YAML frontmatter claims (not ADRs). PR claims reference specs as `spec_id:claim_id` in `prs/<branch>.json`.

Read `.claude/skills/workflow/SKILL.md` for multi-stage feature work. For architectural decisions, update the relevant spec with frontmatter claims and an acceptance/evidence plan before implementation.

### Conditional Protocols

**`ulysses-protocol`** — Activates when 2 consecutive surprises occur during a task. A surprise-gated debugging framework that prevents hallucinated progress through pre-committed recovery actions and falsifiable hypotheses.

Invoke only when stuck: `.claude/skills/ulysses-protocol/SKILL.md`

**`theseus-protocol`** — Use when the task is a refactor (structure changes, behavior preserved). Prevents Refactoring Fugue State via scope locking, adversarial Cassandra audits, and hard reversibility. Do not use for feature work or bug fixes.

Invoke only for refactoring tasks: `.claude/skills/theseus-protocol/SKILL.md`

### Key Rules (always apply)

1. **Specs go in `.specs/`** (not `specs/`). Active authority is spec markdown with YAML frontmatter claims (see `.schemas/spec-v1.json`). Archived ADRs live under `docs/decisions/archive/` for historical context only.
2. **Code and spec updates in the same commit.** If you change code that a spec describes, update the spec in the same commit.
3. **Atomic commits.** One sub-agent = one unit of work = one commit, made after review validates the work.
4. **Sub-agent summaries state**: Claims, Spec/Evidence Alignment, Tests run, Known Gaps, Risks.
5. **Default: human is NOT in the loop.** Operate autonomously. Escalate only when genuinely stuck after investigation.
6. **Orchestrators don't do manual work.** Deploy sub-agents or agent teams. Protect your context window.

### References

- Workflow orchestration: `.claude/skills/workflow/SKILL.md`
- Spec frontmatter schema: `.schemas/spec-v1.json`
- Ulysses protocol: `.claude/skills/ulysses-protocol/SKILL.md`
- Theseus protocol: `.claude/skills/theseus-protocol/SKILL.md`

## Branch Rules for Agents

This project uses **GitHub Flow**: short-lived feature branches off `main`, one PR per unit of work, merge when green. No long-lived integration branches. See `docs/WORKFLOW-MASTER-DESCRIPTION.md` § Branching Strategy for full rationale.

Agent-specific enforcement rules:

1. **Before first commit: verify branch scope matches work.**
   - `git branch --show-current` — check where you are
   - `fix/X` branches are for fixing X — not for new features
   - `feat/X` branches are for feature X — not for unrelated fixes
   - If scope doesn't match, create a new branch from `main`
2. **After PR is merged: delete the branch** (local + remote). This is not optional.
3. **Never create branches with timestamps, UUIDs, or auto-generated suffixes.**
4. **Never commit to `main` directly.**
5. **Plans must include branch creation as Step 0** when the work is a new unit.

Committing unrelated work to an existing branch pollutes PRs, makes reverts dangerous, creates merge conflicts, and makes git history useless for archaeology. **This is non-negotiable.**

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for ALL remaining work** - Every follow-up, deferred decision, or "next session" item MUST be tracked before the session ends. If a spec or archived ADR references future work (e.g., "deferred to ADR-010"), create the tracking item now.
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds


## Local Agent Asset Bridge (`.codex/`, `.claude/`, and `.agents/`)

These directories contain project-local agent instructions. Codex may not
automatically discover project-local `.codex/` skills unless the user config
loads this repo path as a skill root. Claude hooks and slash commands
also cannot be natively installed by Codex. `.agents/skills/` is a
tool-neutral mirror for runtimes that look up skills under `.agents/`.
Treat these assets as **manual operating instructions** for this repo when
they match the task.

### Resolution Order

When these sources disagree, use this order:

1. `AGENTS.md`
2. `.codex/skills/`
3. `.claude/skills/` and `.claude/commands/`
4. `.agents/skills/` as a tool-neutral fallback when no `.codex/` or `.claude/` equivalent applies
5. `.claude/rules/`, `.claude/agents/`, `.claude/team-prompts/`, and hook docs as supporting context

Notes:
- Prefer `.codex/skills/` for Codex-specific project procedures.
- `.agents/skills/` mirrors the `.claude/skills/` set for non-Claude/non-Codex runtimes; prefer the tool-specific copy when one exists.
- Treat older references to `specs/` or legacy ADR paths inside local skill docs as historical if they conflict with the rules above. The current canonical locations are `.specs/` (with frontmatter claims) and `docs/decisions/archive/` for retired ADRs.

### Local Skills to Honor Manually

If the user invokes one of these names, or the task clearly matches one, open the matching local file and follow it directly:

- **Mandatory workflow**: `workflow` (feature lifecycle); spec + claims for architectural decisions
- **Preflight**: `source-of-truth-preflight` (canonical model inventory, illegal-state audit, and acceptance-to-enforcement mapping before domain/lifecycle/runtime work)
- **Conditional protocols**: `ulysses-protocol` (2+ consecutive surprises), `theseus-protocol` (refactoring tasks)
- **Implementation**: `implement`
- **Peer notebook delivery**: `peer-notebook-delivery-guard` (SPEC-CONTROL-PLANE large-unit boundaries, mock accountability, acceptance gates)
- **Research and knowledge**: `research-task`, `knowledge`, `synthesize`, `distill`, `capture-learning`, `session-review`, `assumptions`, `eval`, `taste`, `diagram`
- **Coordination and autonomy**: `team`, `hub-collab`, `deploy-team-hub`, `experiment`, `ulc-loop`, `status`, `escalate`, `claude-prompt`

Path pattern:
- `.codex/skills/<skill-name>/SKILL.md`
- `.claude/skills/<skill-name>/SKILL.md`
- `.agents/skills/<skill-name>/SKILL.md`

### Local Commands to Treat as Project Procedures

The following command docs are not executable slash commands in Codex, but they define repo-specific procedures and should be read before doing matching work:

- Archived HDD commands (historical): `docs/decisions/archive/hdd-commands/`
- Development TDD profiles: `.claude/commands/development/*.md`

If a user references HDD or `/hdd`, treat it as historical; use `workflow` Stage 2 (spec + claims). For development TDD profiles, read `.claude/commands/development/*.md`.

### Local Agent and Team Prompt Reuse

When spawning agents or structuring multi-agent work, reuse these local prompt libraries before inventing new role prompts:

- Role prompts: `.claude/team-prompts/_thoughtbox-process.md`, `.claude/team-prompts/architect.md`, `.claude/team-prompts/debugger.md`, `.claude/team-prompts/researcher.md`, `.claude/team-prompts/reviewer.md`
- Specialized agents: `.claude/agents/*.md`

These files define the repo's preferred agent roles for architecture, debugging, verification, research taste, regression hunting, hook health, and coordination.

### Hook-Derived Guardrails to Follow Manually

Codex cannot auto-register `.claude/settings.json` or its shell hooks here. Still, emulate the intent of the configured hook stack during normal work.

Hook intent by event:

- `PreToolUse` / `BeforeTool`: apply command safety checks before running risky shell commands. Block direct pushes to protected branches, force pushes, branch deletion, dangerous `rm -rf`, and unrequested writes to `.env`-style files.
- `PostToolUse` / `AfterTool`: treat file access and tool side effects as auditable. Keep track of files touched, note meaningful state changes, and prefer leaving a clear trail in commit messages, specs, and handoff artifacts.
- `PermissionRequest`: preserve the repo's git safety policy when escalating. Default to caution on branch-destructive operations and anything that bypasses normal review flow.
- `UserPromptSubmit`: if a prompt implies assumptions, risks, or session context worth preserving, record them in the right project artifact instead of keeping them implicit.
- `SessionStart`: check whether `.claude/session-handoff.json`, `.claude/rules/`, or relevant state files should shape the current task.
- `SessionEnd` / `Stop`: before considering work complete, capture handoff context, update specs/issues, and follow the repo's landing-the-plane steps.
- `PreCompact`: before large context shifts, preserve the minimal durable context needed for safe continuation.
- `Notification`: assume important async events should be surfaced clearly in commentary rather than silently ignored.
- `SubagentStop`: when using agents, persist their outputs in durable artifacts immediately if the surrounding workflow expects that.

Concrete guardrails:

- Do not push directly to protected branches: `main`, `master`, `develop`, `production`
- Do not force-push or delete branches unless the user explicitly requests it
- Avoid modifying `.env` or other secret-bearing files unless the task explicitly requires it
- Preserve the repo's commit-message conventions when committing
- Treat session handoff, file-access tracking, assumption tracking, and stop-time summaries as real workflow requirements even when the hooks are not running automatically

### Knowledge and State Files Worth Consulting Selectively

Use these only when relevant to the task; do not bulk-load them by default:

- Session continuity: `.claude/session-handoff.json`
- Project rules: `.claude/rules/*.md` (path-scoped, loaded automatically when matching files are read)
- Local state: `.claude/state/*`

The intent is to inherit the project's accumulated operating context without pretending the Claude runtime integrations are literally active in Codex.

## Issue Tracking

Use the tracker explicitly selected by the user for the current work. If no
tracker is settled or the available integration cannot create/update issues,
state that clearly and capture follow-ups in the session handoff or relevant
spec artifact. Do not create a shadow tracker or fallback task system without
explicit user approval.

Before starting implementation work:

1. Verify the branch and unit of work.
2. Verify whether a tracker is in scope for this session.
3. If tracker writes are required but unavailable, pause or ask for the exact
   handoff/update format instead of silently falling back.

Before ending implementation work:

1. List any remaining follow-ups in the agreed tracker or handoff artifact.
2. Update the relevant spec/handoff when code changes affect documented
   behavior.
3. Complete the canonical "Landing the Plane" workflow above.

## Learned User Preferences

- Prefer tightly scoped answers on the named blocker; once the issue is clear, stop extra theory, taxonomy, or further decomposition.
- Do not claim work has started until execution actually begins.
- When asked what code is misplaced, cite specific files, routes, or functions — not structural drift essays.
- When the user names structural drift or a boundary violation, accept that judgment and focus on placement or extraction instead of further conceptual breakdown.
- Verify plugin and architecture claims against repo docs and manifests, not code inference alone.
- Identify the concrete unit of work quickly; avoid long meta sessions before stating what is being worked on.
- Project-local setup and `doctor` belong on the plugin/local side, not as synthetic server routes or mocks.
- Do not treat ADRs, specs, scratch maps, tests, or prior audits as authority unless current source/config or executable evidence supports them.
- Supabase schema or migration changes go through branch/PR flow, not direct hosted `db push` from a local `main` checkout.

## Learned Workspace Facts

- Thoughtbox server deploys via Docker; there is no published standalone server binary.
- Local Claude Code plugin artifact: `plugins/thoughtbox-claude-code/` (manifest, hooks, `thoughtbox-channel`).
- Local project inspection reads `.claude/settings.json`, `.claude/settings.local.json`, and `.gitignore` from the user's project cwd.
- Deployed server handles remote auth validation and setup-status persistence; it should not run local project checklists.
- `src/cli/` lives in the server repo but represents a collapsed CLI/server artifact boundary the user wants separated.
- Default Supabase investigation target is the linked Supabase project unless the user specifies otherwise.
- Local docker-compose may omit Supabase env vars, causing MCP session setup to fail when branch handlers require `SUPABASE_URL`.
- ADR/HDD coupling is concentrated in agent/governance surfaces and PR validation (`pnpm validate:pr` resolving PR claims to ADR JSON); runtime code is lightly coupled.
- `src/http/cli-routes.ts` currently backs `thoughtbox init`/`thoughtbox doctor` and contains setup/diagnostic orchestration beyond a narrow HTTP adapter role.
- The Aspirational Systems Audit lives at `docs/aspirational-systems-audit.md` (a read-only report, not a claim-bearing `.specs/` authority) and classifies claims by current wiring evidence.
