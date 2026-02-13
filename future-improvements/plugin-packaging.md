# Package Thoughtbox Workflow System as a Claude Code Plugin

## Problem

The entire workflow system (OODA loops, commands, skills, agents) lives in `.claude/` in the project directory. Every agent has write access. Agents routinely overwrite, truncate, or fail to preserve user-authored content in these files. This has been happening for months — confirmed by git history showing zero loop references in skills/commands/agents despite a supervised refactor that should have wired them in.

The compound-engineering plugin (Every) doesn't have this problem because it's installed as a plugin at `~/.claude/plugins/cache/`. Agents don't write there. The system is effectively immutable during normal operation.

## Solution

Package the Thoughtbox workflow system as a Claude Code plugin. Once installed, agents can read and invoke the commands/skills/agents but cannot modify them.

## What Goes Into the Plugin

### Commands (~50 files)
- `loops/` — 15 OODA loop building blocks (exploration, authoring, refinement, verification, orchestration) + meta docs
- `specifications/` — spec-designer, spec-orchestrator, spec-validator, specification-suite
- `hdd/` — Hypothesis-Driven Development workflow (init, research, stage-adr, validate, decide, state, overview, quick-reference)
- `development/` — implement-spec, hub-tdd, agentops-tdd, multi-agent-tdd, profiles-tdd, parallel-executor, spec-to-test, implementation-variants
- `meta/` — capture-learning, dgm-evolve, code-review-game, refactoring-game, ulysses-protocol, virgil-protocol, complexity-navigator, output-gap-analysis, learning-accelerator, feature-discovery
- `research/` — docs-researcher
- `startup/` — metaclaude, metacursor, prime
- `utils/` — post-edit-workflow

### Skills (~12 directories)
- `capture-learning/`
- `distill/`
- `escalate/`
- `implement/`
- `research-task/`
- `status/`
- `synthesize/`
- `taste/`
- `hub-collab/`
- `diagram/`
- `team/`
- `deploy-team-hub/`

### Agents (~11 files)
- `fact-checking-agent.md`
- `meta-agent.md`
- `hub-architect.md`, `hub-debugger.md`, `hub-manager.md`
- `architecture-diagrammer.md`
- `coordination-momentum.md`
- `research-taste.md`
- `triage-fix.md`
- `verification-judge.md`
- `dependency-verifier.md`

### Rules (move to plugin CLAUDE.md or keep as project rules — decide at build time)
- `ooda-foundation.md`
- `spiral-detection.md`
- `escalation-protocol.md`
- `continual-calibration.md`
- `git-workflow.md`
- `post-edit.md`

## What Stays in the Project `.claude/`
- Project-specific CLAUDE.md instructions
- Team-prompts (spawning context for specific workspaces)
- Any project-specific overrides or additions

## Critical Step: Wire the Loops FIRST

Before packaging, complete the refactor that was lost: every command, skill, and agent that should compose the OODA loops must actually reference them. The loops index already documents the intended compositions:

```
Spec Design:     exploration/problem-space → authoring/spec-drafting → refinement/requirement-quality → verification/acceptance-gate
Implementation:  orchestration/dependency-resolver → orchestration/queue-processor → authoring/code-generation → orchestration/spiral-detector → verification/integration-test
Code Review:     exploration/codebase-discovery → refinement/code-quality → refinement/consistency-check → verification/acceptance-gate
Fact-Checking:   orchestration/queue-processor → verification/fact-checking → refinement/consistency-check
```

Do this wiring manually or verify every change before committing. Do NOT trust an agent to do a bulk refactor of these files without verifying each one.

## Structure Ideas from Compound-Engineering

Their plugin structure that works well:

```
plugin-name/
  .claude-plugin/
    plugin.json          # name, version, description, mcpServers
  agents/
    review/              # grouped by function
    research/
    design/
    workflow/
    docs/
  commands/
    workflows/           # core loop: plan, work, review, compound
    (utility commands)
  skills/
    skill-name/
      SKILL.md
      references/        # deep-dive docs
      templates/
      assets/
  CLAUDE.md              # plugin development guidelines
  README.md              # component inventory
  CHANGELOG.md           # version history
```

Things to adopt:
1. **`plugin.json`** — version, description, MCP server registration (Thoughtbox server itself)
2. **Agent grouping by function** — not flat, organized into subdirectories
3. **Schema validation for compounding** — their `compound-docs` skill has a `schema.yaml` with enum-validated YAML frontmatter for searchable documentation. Adopt this pattern.
4. **The `/compound` step** — explicit "stop and document what you learned" workflow that produces a file at a known path. Currently missing from our system.
5. **Known-path file artifacts** — every workflow produces a file at a predictable location. Plans at `docs/plans/`, solutions at `docs/solutions/`, todos at `todos/`. Makes success ls-verifiable.

## Verification Plan

After building the plugin:
1. `grep -r '@loops' commands/ skills/ agents/` — every non-trivial command should reference loops
2. Install the plugin in a fresh project
3. Run each command and verify it works
4. Confirm agents CANNOT write to the plugin directory
5. Confirm agents CAN still create project-specific files (plans, solutions, todos) in the working directory

## Priority

High. This is a prerequisite for everything else. Until the system is write-protected, any agent session can silently destroy months of work.
