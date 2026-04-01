## Post-Edit Workflow

After every meaningful code edit or cluster of related edits:

1. **Review**: `git status` + `git diff` — understand what changed
2. **Stage**: Add specific files (not `git add .` — be selective)
3. **Commit**: Descriptive message explaining the "why" not just the "what"
4. **Record**: Note significant decisions, patterns learned, or gotchas in agent memory
5. **Verify**: Run relevant tests/checks if code was changed
