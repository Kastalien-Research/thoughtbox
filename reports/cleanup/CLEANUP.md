# Codebase Cleanup Plan

Do these in order. Each step is independent — you can stop after any step and the repo is in a better state than before. Estimated time per step assumes an agent doing the work.

---

## Phase 1: Delete dead weight (no decisions required)

### Step 1: Remove empty/abandoned directories and loose files

```bash
rm -rf .specification-suite/
rm -rf .letta/
rm -rf staging/
rm observatory-test.html
rm scratch.md
rm proof-run-001-hypotheses.md
rm proof-run-findings.md
rm server.json
```

Verify nothing imports or references these first:
```bash
rg -l "specification-suite|\.letta|staging/" --glob '!node_modules' --glob '!.git'
rg -l "observatory-test\.html|scratch\.md|proof-run" --glob '!node_modules' --glob '!.git'
```

### Step 2: Delete ai_docs/ (886 files of vendored static docs)

You have context7 and Exa MCP servers configured. These are dead weight.

```bash
rm -rf ai_docs/
```

If anything references `ai_docs/` in code or config:
```bash
rg -l "ai_docs" --glob '!node_modules' --glob '!.git'
```
Fix those references to use context7 or inline the specific snippet needed.

### Step 3: Delete .dgm/ (3 files, unclear purpose, superseded by dgm-specs/)

```bash
rm -rf .dgm/
```

---

## Phase 2: Consolidate spec directories (one decision: which stays)

### Step 4: Merge .specs/ into specs/

The rule in AGENTS.md already says `specs/` is canonical. Make reality match.

```bash
# For each subdirectory in .specs/, move to specs/
mv .specs/auditability specs/auditability-observatory
mv .specs/distbook-phase-zero specs/distbook-phase-zero
mv .specs/letta-specific specs/letta-specific
mv .specs/mcp-thoughtbox-enhancements specs/mcp-thoughtbox-enhancements
mv .specs/mental-models-tag-fix specs/mental-models-tag-fix
mv .specs/ooda-loops specs/ooda-loops
mv .specs/quality-diversity specs/quality-diversity
mv .specs/self-improvement-loop specs/self-improvement-loop
mv .specs/vertical-server specs/vertical-server

# Move top-level .specs/ files
mv .specs/SPEC-*.md specs/
mv .specs/inventory.md specs/
mv .specs/README.md specs/specs-readme-old.md
mv .specs/IMPLEMENTATION-READY.md specs/

rm -rf .specs/
```

Then add status headers to each spec. A one-line front matter:
- `Status: implemented` — code exists and tests pass
- `Status: draft` — written but not started
- `Status: abandoned` — idea didn't pan out, keeping for reference

### Step 5: Delete abandoned specs

After marking statuses, delete anything marked `abandoned`. If you're unsure, mark it `abandoned` anyway — it's in git history.

---

## Phase 3: Consolidate "thinking" directories

### Step 6: Create one place for pre-work thinking

Keep `pain/` — it's a good name for "problems that motivate work." Move related content there:

```bash
mv future-improvements/* pain/
rmdir future-improvements/
mv reports/* pain/
rmdir reports/
```

### Step 7: Archive or delete loose planning artifacts

```bash
# agentic-dev-team/ is a spec + rules + skills — but the skills are duplicated in .claude/
# Keep the spec, delete the duplicates
rm -rf agentic-dev-team/skills/
rm -rf agentic-dev-team/research-workflows-REINIT-PLEASE/

# research-workflows/ is one SQLite database with no clear owner
rm -rf research-workflows/
```

### Step 8: Consolidate self-improvement specs into specs/

```bash
mv self-improvement/ specs/self-improvement-archive/
```

This is now in the same place as all other specs. One directory to check.

---

## Phase 4: Trim agent infrastructure

### Step 9: Audit which .claude/agents/ are actually used

```bash
# Check which agents are referenced in skills, hooks, or settings
for agent in .claude/agents/*.md; do
  name=$(basename "$agent" .md)
  count=$(rg -c "$name" .claude/skills/ .claude/hooks/ .claude/settings.json 2>/dev/null | awk -F: '{s+=$2}END{print s+0}')
  echo "$count $name"
done | sort -n
```

Delete any agent with 0 references. It's in git history if needed.

### Step 10: Audit which .claude/skills/ are actually used

Same approach — check if anything invokes them. The skill list in the system prompt shows 80+ skills including third-party ones. If a skill hasn't been invoked in your last 5 sessions, it's noise.

### Step 11: Audit .claude/hooks/

28 shell scripts. Check which are actually wired up in `.claude/settings.json`. Delete unwired hooks.

```bash
cat .claude/settings.json | grep -o '[^"]*\.sh' | sort
# Compare against:
ls .claude/hooks/*.sh | sort
```

---

## Phase 5: Address the test gap

### Step 12: Delete behavioral .md test files or convert them

`tests/gateway-behavioral.md`, `tests/hub-behavioral.md`, etc. are specs about tests, not tests. Either:
- Convert each to an actual `.test.ts` file
- Or delete them (the specs in `specs/` already describe the behavior)

### Step 13: Move evaluation/agentops tests near the code they test

`tests/unit/` has 14 files, almost all for the evaluation subsystem. These should be colocated or clearly connected to the `agentops/` or `src/evaluation/` code they exercise.

---

## Phase 6: Final cleanup

### Step 14: Remove dgm-specs/ if superseded

`dgm-specs/` (22 files) appears to be a hypothesis-driven benchmark system. If `agentops/` replaced it, delete it. If not, move it under `specs/` with the rest.

### Step 15: Clean up docs/

`docs/` has 43 files across brainstorms, ADRs, solutions, multi-agent docs, and papers. Keep:
- `docs/ADR/` — these are valuable
- `docs/docs-for-humans/` — user-facing docs
- `docs/docs-for-llms/` — agent-facing docs
- `docs/WORKFLOW-MASTER-DESCRIPTION.md` — referenced by AGENTS.md

Move or delete:
- `docs/brainstorms/` — move to `pain/`
- `docs/papers/` — these are local copies of papers, same problem as `ai_docs/`
- `docs/solutions/` — if still relevant, keep; if stale, delete
- `docs/2025-11-25.ts` — a TypeScript file in docs/?
- `docs/multi-agent/` — move to `specs/multi-agent/` if it's a spec

### Step 16: Update AGENTS.md and CLAUDE.md

After cleanup, these instruction files should reflect the new structure. Remove references to deleted directories. Simplify the workflow description if you've trimmed skills.

---

## What NOT to do

- Don't reorganize src/. The source code structure is fine.
- Don't touch .beads/ or .doltcfg/. Issue tracking is working.
- Don't rewrite the workflow system. Just trim unused skills.
- Don't create new organizational systems. The goal is less structure, not different structure.
- Don't write a meta-plan about the cleanup plan. This document is the plan. Execute it.
