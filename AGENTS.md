
## Development Workflow (Source of Truth)

**Read `WORKFLOW-MASTER-DESCRIPTION.md` before starting any non-trivial work.** It defines the full lifecycle: ideation → spec + ADR → plan → implement → review → revision → compound → reflection.

### Key Rules (always apply)

1. **Specs go in `specs/`** (not `.specs/`). ADRs use the HDD lifecycle: `.adr/staging/` → `.adr/accepted/` or `.adr/rejected/`.
2. **Code and spec updates in the same commit.** If you change code that a spec describes, update the spec in the same commit.
3. **Atomic commits.** One sub-agent = one bead = one unit of work = one commit, made after review validates the work.
4. **Sub-agent summaries use the structured format** defined in `WORKFLOW-MASTER-DESCRIPTION.md` (Claims, Hypothesis Alignment, Tests, Known Gaps, Risks).
5. **Default: human is NOT in the loop.** Operate autonomously up to the escalation thresholds defined in `agentic-dev-team/agentic-dev-team-spec.md`. Escalate only when those thresholds are met.
6. **Orchestrators don't do manual work.** Deploy sub-agents or agent teams. Protect your context window.

### References

- Full workflow: `WORKFLOW-MASTER-DESCRIPTION.md`
- HDD process: `.claude/commands/hdd/hdd.md`
- Agent team structure: `agentic-dev-team/agentic-dev-team-spec.md`
- Escalation thresholds: `agentic-dev-team/agentic-dev-team-spec.md` § Escalation Threshold Definition

## Branch Hygiene (Before First Commit)

**Before writing the first commit of any new unit of work**, you MUST:

1. **Check the current branch**: `git branch --show-current`
2. **Verify scope match**: Does the branch name match the work you're about to do?
   - `fix/X` branches are for fixing X — not for new features
   - `feat/X` branches are for feature X — not for unrelated fixes
   - `main` is never the right place to commit directly
3. **Create a new branch if scope doesn't match**:
   ```bash
   git checkout main && git pull origin main
   git checkout -b <type>/<descriptive-name>
   ```
   Use: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/` prefixes.

**This is non-negotiable.** Committing unrelated work to an existing branch:
- Pollutes PRs with unrelated changes
- Makes reverts dangerous
- Creates merge conflicts for others
- Makes git history useless for archaeology

**Plans must include branch creation as Step 0** when the work is a new unit.

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
