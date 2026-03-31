
## Development Workflow (Source of Truth)

Every unit of work runs through a mandatory skill. Two additional protocols activate conditionally.

### Mandatory Skills

**`hdd`** — Hypothesis-Driven Development for architectural decisions, new features, protocol implementations, and behavior-changing refactors. Produces a staging ADR + spec pair that must be validated before accepting. Code is an implementation artifact; ADRs are the source of truth.

Read `.claude/skills/hdd/SKILL.md` when the work requires an architectural decision.

### Conditional Protocols

**`ulysses-protocol`** — Activates when 2 consecutive surprises occur during a task. A surprise-gated debugging framework that prevents hallucinated progress through pre-committed recovery actions and falsifiable hypotheses.

Invoke only when stuck: `.claude/skills/ulysses-protocol/SKILL.md`

**`theseus-protocol`** — Use when the task is a refactor (structure changes, behavior preserved). Prevents Refactoring Fugue State via scope locking, adversarial Cassandra audits, and hard reversibility. Do not use for feature work or bug fixes.

Invoke only for refactoring tasks: `.claude/skills/theseus-protocol/SKILL.md`

### Key Rules (always apply)

1. **Specs go in `.specs/`** (not `specs/`). ADRs use the HDD lifecycle: `.adr/staging/` → `.adr/accepted/` or `.adr/rejected/`.
2. **Code and spec updates in the same commit.** If you change code that a spec describes, update the spec in the same commit.
3. **Atomic commits.** One sub-agent = one unit of work = one commit, made after review validates the work.
4. **Sub-agent summaries state**: Claims, Hypothesis Alignment, Tests run, Known Gaps, Risks.
5. **Default: human is NOT in the loop.** Operate autonomously. Escalate only when genuinely stuck after investigation.
6. **Orchestrators don't do manual work.** Deploy sub-agents or agent teams. Protect your context window.

### References

- HDD process: `.claude/skills/hdd/SKILL.md`
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

1. **File issues for ALL remaining work** - Every follow-up, deferred decision, or "next session" item MUST be tracked before the session ends. If an ADR references future work (e.g., "deferred to ADR-010"), create the tracking item now.
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


## Local Agent Asset Bridge (`.claude/` and `.gemini/`)

These directories contain project-local agent instructions. Codex cannot natively install Claude/Gemini hooks or slash commands from them, so treat them as **manual operating instructions** for this repo.

### Resolution Order

When these sources disagree, use this order:

1. `AGENTS.md`
2. `.claude/skills/` and `.claude/commands/`
3. `.gemini/skills/` and `.gemini/commands/`
4. `.claude/rules/`, `.claude/agents/`, `.claude/team-prompts/`, and hook docs as supporting context

Notes:
- Prefer `.claude/` over `.gemini/`. The inventories are nearly mirrored, but `.claude/` is the primary source in this repo.
- Treat older references to `specs/` or legacy ADR paths inside local skill docs as historical if they conflict with the rules above. The current canonical locations remain `.specs/` and `.adr/`.

### Local Skills to Honor Manually

If the user invokes one of these names, or the task clearly matches one, open the matching local file and follow it directly:

- **Mandatory workflow**: `hdd` (architectural decisions and new features)
- **Conditional protocols**: `ulysses-protocol` (2+ consecutive surprises), `theseus-protocol` (refactoring tasks)
- **Implementation**: `implement`
- **Research and knowledge**: `research-task`, `knowledge`, `synthesize`, `distill`, `capture-learning`, `session-review`, `assumptions`, `eval`, `taste`, `diagram`
- **Coordination and autonomy**: `team`, `hub-collab`, `deploy-team-hub`, `experiment`, `ulc-loop`, `loop-status`, `status`, `escalate`, `claude-prompt`

Primary path pattern:
- `.claude/skills/<skill-name>/SKILL.md`

Fallback path pattern:
- `.gemini/skills/<skill-name>/SKILL.md`

### Local Commands to Treat as Project Procedures

The following command docs are not executable slash commands in Codex, but they define repo-specific procedures and should be read before doing matching work:

- HDD command set: `.claude/commands/hdd/*.md`
- Development TDD profiles: `.claude/commands/development/*.md`
- Gemini mirrors of the same procedures: `.gemini/commands/**/*.toml`

If a user references `/hdd`, HDD phases, or the development TDD profiles, read the corresponding local command or skill doc first and then execute the procedure manually.

### Local Agent and Team Prompt Reuse

When spawning agents or structuring multi-agent work, reuse these local prompt libraries before inventing new role prompts:

- Role prompts: `.claude/team-prompts/_thoughtbox-process.md`, `.claude/team-prompts/architect.md`, `.claude/team-prompts/debugger.md`, `.claude/team-prompts/researcher.md`, `.claude/team-prompts/reviewer.md`
- Specialized agents: `.claude/agents/*.md`

These files define the repo's preferred agent roles for architecture, debugging, verification, research taste, regression hunting, hook health, and coordination.

### Hook-Derived Guardrails to Follow Manually

Codex cannot auto-register `.claude/settings.json`, `.gemini/settings.json`, or their shell hooks here. Still, emulate the intent of the configured hook stack during normal work.

Hook intent by event:

- `PreToolUse` / `BeforeTool`: apply command safety checks before running risky shell commands. Block direct pushes to protected branches, force pushes, branch deletion, dangerous `rm -rf`, and unrequested writes to `.env`-style files.
- `PostToolUse` / `AfterTool`: treat file access and tool side effects as auditable. Keep track of files touched, note meaningful state changes, and prefer leaving a clear trail in commit messages, specs, and handoff artifacts.
- `PermissionRequest`: preserve the repo's git safety policy when escalating. Default to caution on branch-destructive operations and anything that bypasses normal review flow.
- `UserPromptSubmit`: if a prompt implies assumptions, risks, or session context worth preserving, record them in the right project artifact instead of keeping them implicit.
- `SessionStart`: check whether `.claude/session-handoff.json`, `.claude/rules/`, or relevant state files should shape the current task.
- `SessionEnd` / `Stop`: before considering work complete, capture handoff context, update specs/ADRs/issues, and follow the repo's landing-the-plane steps.
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

The intent is to inherit the project's accumulated operating context without pretending the Claude/Gemini runtime integrations are literally active in Codex.
