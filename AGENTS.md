
## Development Workflow (Source of Truth)

**Use `/workflow` to execute the full development lifecycle.** It sequences 8 stages: ideation → spec + ADR → plan → implement → review → revision → compound → reflection.

The conductor skill dispatches to stage-specific skills at each step. Run `/workflow <idea>` to start a new workflow, or `/workflow` to resume an in-progress one.

### Key Rules (always apply)

1. **Specs go in `.specs/`** (not `specs/`). ADRs use the HDD lifecycle: `.adr/staging/` → `.adr/accepted/` or `.adr/rejected/`.
2. **Code and spec updates in the same commit.** If you change code that a spec describes, update the spec in the same commit.
3. **Atomic commits.** One sub-agent = one bead = one unit of work = one commit, made after review validates the work.
4. **Sub-agent summaries use the structured format** defined in the `/workflow` conductor skill (Claims, Hypothesis Alignment, Tests, Known Gaps, Risks).
5. **Default: human is NOT in the loop.** Operate autonomously up to the escalation thresholds defined in `agentic-dev-team/agentic-dev-team-spec.md`. Escalate only when those thresholds are met.
6. **Orchestrators don't do manual work.** Deploy sub-agents or agent teams. Protect your context window.

### Stage Skills

| Stage | Skill | Description |
|-------|-------|-------------|
| 1. Ideation | `/workflow-ideation` | Evaluate whether idea is worth implementing |
| 2. Dev-Time Docs | `/hdd` | Create spec and ADR via HDD process |
| 3. Planning | `/workflows-plan` | Plan implementation approach |
| 4. Implementation | `/workflows-work` | Execute the plan with sub-agents |
| 5. Review | `/workflows-review` | Verify claims and test hypotheses |
| 6. Revision | `/workflow-revision` | Fix review findings, loop until pass |
| 7. Compound | `/workflows-compound` | Capture learnings |
| 8. Reflection | `/workflow-reflection` | Finalize ADRs, close issues, merge |

### References

- Workflow conductor: `.claude/skills/workflow/SKILL.md`
- Workflow rationale and failure modes: `docs/WORKFLOW-MASTER-DESCRIPTION.md`
- HDD process: `.claude/commands/hdd/hdd.md`
- Agent team structure: `agentic-dev-team/agentic-dev-team-spec.md`
- Escalation thresholds: `agentic-dev-team/agentic-dev-team-spec.md` § Escalation Threshold Definition

## Branch Rules for Agents

The full branching strategy (GitHub Flow) is defined in `docs/WORKFLOW-MASTER-DESCRIPTION.md` § Branching Strategy. These are the agent-specific enforcement rules:

1. **Before first commit: verify branch scope matches work.**
   - `git branch --show-current` — check where you are
   - `fix/X` branches are for fixing X — not for new features
   - `feat/X` branches are for feature X — not for unrelated fixes
   - If scope doesn't match, create a new branch from `main`
2. **Every branch MUST have a corresponding bead.** Create the bead before creating the branch.
3. **Branch name MUST match the bead's subject** (e.g., bead "Fix gateway timeout" → `fix/gateway-timeout`).
4. **After PR is merged: delete the branch** (local + remote). This is not optional.
5. **Never create branches with timestamps, UUIDs, or auto-generated suffixes.**
6. **Never commit to `main` directly.**
7. **Never commit to `beads-sync`.**
8. **Plans must include branch creation as Step 0** when the work is a new unit.

Committing unrelated work to an existing branch pollutes PRs, makes reverts dangerous, creates merge conflicts, and makes git history useless for archaeology. **This is non-negotiable.**

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for ALL remaining work** - Every follow-up, deferred decision, or "next session" item MUST become a bead before the session ends. If an ADR references future work (e.g., "deferred to ADR-010"), create the bead now — the ADR process starts next session, but the tracking starts this one. Prose in handoff JSON is not a substitute for a bead.
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
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

<!-- BEGIN BEADS INTEGRATION -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs with git:

- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

<!-- END BEADS INTEGRATION -->


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

- Workflow lifecycle: `workflow`, `workflow-ideation`, `workflow-brainstorming`, `workflows-plan`, `workflows-work`, `workflows-review`, `workflow-revision`, `workflows-compound`, `workflow-reflection`
- HDD and implementation: `hdd`, `implement`
- Research and knowledge: `research-task`, `knowledge`, `synthesize`, `distill`, `capture-learning`, `session-review`, `assumptions`, `eval`, `taste`, `diagram`
- Coordination and autonomy: `team`, `hub-collab`, `deploy-team-hub`, `experiment`, `ulc-loop`, `loop-status`, `status`, `escalate`, `claude-prompt`

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
- `PostToolUse` / `AfterTool`: treat file access and tool side effects as auditable. Keep track of files touched, note meaningful state changes, and prefer leaving a clear trail in commit messages, beads, specs, and handoff artifacts.
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
