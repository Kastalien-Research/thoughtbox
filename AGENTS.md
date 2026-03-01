
## Development Workflow (Source of Truth)

**Use `/workflow` to execute the full development lifecycle.** It sequences 8 stages: ideation → spec + ADR → plan → implement → review → revision → compound → reflection.

The conductor skill dispatches to stage-specific skills at each step. Run `/workflow <idea>` to start a new workflow, or `/workflow` to resume an in-progress one.

### Key Rules (always apply)

1. **Specs go in `specs/`** (not `.specs/`). ADRs use the HDD lifecycle: `.adr/staging/` → `.adr/accepted/` or `.adr/rejected/`.
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

1. **File issues for remaining work** - Create issues for anything that needs follow-up
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
