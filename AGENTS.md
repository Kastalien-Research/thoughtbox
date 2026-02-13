
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
