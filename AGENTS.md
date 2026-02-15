# AGENTS.md - Codex CLI Instructions

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
| 3. Planning | `/workflows:plan` | Plan implementation approach |
| 4. Implementation | `/workflows:work` | Execute the plan with sub-agents |
| 5. Review | `/workflows:review` | Verify claims and test hypotheses |
| 6. Revision | `/workflow-revision` | Fix review findings, loop until pass |
| 7. Compound | `/workflows:compound` | Capture learnings |
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

## REQUIRED: Use Thoughtbox MCP for Planning

For ANY planning, analysis, or multi-step reasoning task, you MUST use the thoughtbox MCP server.

### When to Use Thoughtbox

MANDATORY for:
- Task breakdown and decomposition
- Complexity analysis
- Architecture decisions
- Trade-off evaluation
- Implementation planning
- Comparing alternative approaches

### Thoughtbox Usage Pattern

1. **Initialize session:**
   ```
   mcp_tool_call thoughtbox_gateway { "operation": "start_new", "args": { "title": "<task description>" } }
   ```

2. **Load cipher notation:**
   ```
   mcp_tool_call thoughtbox_gateway { "operation": "cipher" }
   ```

3. **Record thoughts:**
   ```
   mcp_tool_call thoughtbox_gateway { "operation": "thought", "args": { "content": "<your reasoning>" } }
   ```

4. **For branching exploration:**
   ```
   mcp_tool_call thoughtbox_gateway { "operation": "thought", "args": { "branchId": "new-branch", "branchFromThought": "S3" } }
   ```

### Important Rules

- Always initialize a session before recording thoughts
- Use the cipher notation for structured reasoning
- Create branches when comparing multiple approaches
- Record your actual reasoning, not placeholder text
- Reference previous thoughts using S1, S2, S3, etc.

## Project Context

This is the Thoughtbox MCP server repository. You are working on the cognitive enhancement tooling itself.
