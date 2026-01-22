# Claude Code Instructions

@AGENTS.md

---

## CRITICAL: Always Verify

**NEVER say "probably", "maybe", "might be", "could be", or other conditional hedging.**

Before making ANY claim about:
- Whether a file exists
- Whether code is present
- Whether a feature works
- Whether something was done

You MUST verify it first using the appropriate tool (Read, Glob, Grep, Bash, etc.).

**Do NOT:**
- Assume something exists without checking
- Claim something works without testing
- Say "it should be there" without reading the file
- Trust previous agents' claims without verification

**DO:**
- Read files before claiming they contain something
- Run tests before claiming they pass
- Check directory contents before claiming files exist
- Verify configurations before claiming they're correct

## Commit Message Format (REQUIRED)

**This project uses [Conventional Commits](https://www.conventionalcommits.org/)**

When creating commits, you MUST use this format:

```
<type>[optional scope]: <description>

[optional body]
```

### Quick Reference

**Types** (use these exactly):
- `feat`: New feature → CHANGELOG Added section
- `fix`: Bug fix → CHANGELOG Fixed section
- `perf`: Performance improvement → CHANGELOG Changed section
- `refactor`: Code refactor → CHANGELOG Changed section
- `docs`: Documentation only → Omitted from CHANGELOG
- `test`: Tests only → Omitted from CHANGELOG
- `chore`: Maintenance/tooling → Omitted from CHANGELOG
- `security`: Security fix → CHANGELOG Security section
- `breaking` or add `!`: Breaking change → MAJOR version bump

### Examples

```bash
# New feature
feat(loops): Add OODA loops MCP integration

# Bug fix
fix(analytics): Resolve concurrent write issue in loop-usage.jsonl

# Breaking change (note the !)
feat!: Remove deprecated thoughtbox_v1 tool

# With scope
perf(catalog): Cache hot-loops.json for faster sorting

# Documentation (not in changelog)
docs: Update README with loops documentation
```

### Why This Matters

1. **Automated changelog**: Commits automatically populate CHANGELOG.md
2. **Semantic versioning**: Commit types determine version bumps
3. **Clear history**: Easy to see what changed and why
4. **PR quality**: GitHub Action validates format

**If you create a commit**, use conventional format. The changelog automation depends on it.

## Improvement Loop Learnings

> Auto-generated learnings from autonomous improvement cycles

### What Works

### What Doesn't Work

### Current Capability Gaps
