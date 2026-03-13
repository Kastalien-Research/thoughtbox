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

## Agent Teams — Thoughtbox Integration

When participating in an Agent Team, bootstrap Thoughtbox as your reasoning substrate:

1. **Quick join** (single call): `thoughtbox_hub { operation: "quick_join", args: { name: "<your-role>", workspaceId: "<ID from spawn prompt>", profile: "<COORDINATOR|ARCHITECT|DEBUGGER|SECURITY|RESEARCHER|REVIEWER>" } }`
2. **Load cipher**: `thoughtbox_gateway { operation: "cipher" }`
3. **Begin work** — record decisions as thoughts, proposals as hub proposals

Spawn prompt templates for teammates are in `.claude/team-prompts/`.

### What to Record as Thoughts
- Key decisions and their reasoning
- Hypotheses before investigation
- Conclusions after analysis
- Disagreements with other agents' conclusions

### What NOT to Record
- Routine file reads or searches
- Every intermediate step
- Information that's already in the codebase

## Decided Architecture (v1 deployment) — NON-NEGOTIABLE

- **Execution plane**: Google Cloud Run
- **Control plane / persistence**: Supabase — Postgres, Auth, Storage
- **Billing**: Stripe
- **Session routing**: Cloud Memorystore for Redis (live transport state only)
- **NO Cloud Storage FUSE** — all persistence goes through Supabase, containers are stateless
- **DUAL BACKEND**: FileSystemStorage (local/self-hosted) + SupabaseStorage (deployed). Both implement same interfaces. Neither replaces the other.
- Initiative spec: `.specs/deployment/v1-initiative.md`

## Sub-Agent Dispatch Rules

1. **Hard constraints first**: When dispatching sub-agents, put decided constraints from the initiative spec at the TOP of the prompt as non-negotiable. Current codebase state goes SECOND, labeled as "what needs to change."
2. **Review output against spec**: Before presenting sub-agent output to the user, check it against the initiative spec. If it introduces infrastructure or approaches not in the spec, catch it before it reaches the user.
3. **No invented constraints**: Never treat "minimize code changes" as a goal unless the user explicitly says so. Deployment initiatives exist because code needs to change.

## Improvement Loop Learnings

> Auto-generated learnings from autonomous improvement cycles

### What Works

### What Doesn't Work

- Sub-agents optimizing for "no code changes" when the initiative exists to make code changes
- Presenting sub-agent output without verifying it against the initiative spec
- Writing sub-agent prompts before checking existing infrastructure. The prompt IS the plan — if you assume a workflow (e.g., local `docker build` + `docker push`) without checking what's already in place (e.g., Cloud Build triggers), the sub-agent executes the wrong plan correctly. Always audit existing infrastructure before writing implementation prompts.

### Current Capability Gaps
