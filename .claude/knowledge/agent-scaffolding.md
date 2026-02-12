# Agent Scaffolding

How agents work in this project — invocation patterns, critical rules, and known pitfalls.

## Agent Inventory

### CI Agents (.claude/agents/)
| Agent | Role | Model | Key Constraint |
|-------|------|-------|----------------|
| cost-governor | Track token spend, enforce $80/week budget | haiku | Read-only |
| hook-health | Diagnose hook failures, produce template patches | haiku | MUST NOT write to .claude/hooks/ |
| assumption-auditor | Audit .assumptions/registry.jsonl for stale entries | haiku | Walk full registry |
| regression-sentinel | Watch eval metrics for trend regressions | haiku | Trends, not single checks |
| devils-advocate | Adversarial review of specs/code/plans | opus | Read-only + QD database writes |
| silent-failure-hunter | Find code that fails without anyone knowing | opus | Read-only + QD database writes |

### Hub Agents (.claude/agents/)
| Agent | Role |
|-------|------|
| hub-coordinator | Creates workspaces, manages lifecycle |
| hub-architect | Analyzes structure, creates proposals |
| hub-debugger | Root cause analysis, reviews proposals |

## Dual-Invocation Architecture

Every agent can be invoked two ways:

**Path 1: Task tool sub-agents** (preferred for interactive sessions)
- `subagent_type: "general-purpose"` — ALWAYS use this type
- Read `.claude/agents/<name>.md` and pass its content as the prompt
- Append task-specific context to the prompt
- Uses `run_in_background: true` for parallelizable work

**Path 2: Agent SDK scripts** (for headless/CI execution)
- `npx tsx scripts/agents/<name>.ts`
- Uses `@anthropic-ai/claude-agent-sdk` with `query()` API
- `parseFrontmatter()` in `scripts/agents/run-agent-util.ts` reads .md frontmatter

**Shared data stores** (both paths read/write the same):
| Store | Path | Format |
|-------|------|--------|
| QD Database | `research-workflows/workflows.db` | SQLite |
| Assumption Registry | `.assumptions/registry.jsonl` | JSONL |
| Eval Baselines | `.eval/baselines.json` | JSON |
| DGM State | `.dgm/{fitness,lineage,niche-grid}.json` | JSON |
| ULC State | `.claude/ulc-state.local.json` | JSON (gitignored) |

## Critical Rules

1. **ALWAYS use `subagent_type: "general-purpose"`** — custom agent types do NOT get ToolSearch. Put role-specific instructions in the prompt instead.
2. **ALWAYS use `run_in_background: true`** for team agents — without this, you get no task_id and CANNOT force-kill them. In-process foreground teammates run until turn budget exhaustion.
3. **DO NOT use `mcpServers:` in agent frontmatter** — sub-agents inherit parent MCP tools automatically. `mcpServers` causes "Tool names must be unique" API errors.
4. **Agent definitions are cached at session start** — changes to `.claude/agents/*.md` require a new session. New agent files created mid-session are NOT discoverable by Task tool.
5. **ToolSearch MUST be in agent `tools:` frontmatter** — without it, agents can't load MCP tools at runtime and hub integration instructions in prompts are dead letters.
6. **Verify hub integration EARLY** — within 2-3 minutes of spawning, check that agents have actually posted to hub channels.
7. **Shut down coordinator LAST** — coordinator orchestrates shutdown of other teammates.

## ULC Ralph Integration

The `/ulc-loop` skill creates a Ralph Wiggum loop with the ULC decision procedure:
- Prompt at `.claude/skills/ulc-loop/ulc-prompt.md`
- State file at `.claude/ulc-state.local.json` (gitignored)
- Ralph state at `.claude/ralph-loop.local.md` (gitignored)
- Completion promise: "BUDGET EXHAUSTED OR ALL WORK COMPLETE"

## Hub API Data Shapes

- Problems: `dependsOn[]`, `comments[]`, `assignedTo`, `resolution`
- Proposals: `reviews[]` with `reviewerId` (NOT reviewerAgentId)
- Consensus: `agreedBy[]`, `thoughtRef`, `name`, `description`
- Channels: 1-4 messages per problem with rich markdown
