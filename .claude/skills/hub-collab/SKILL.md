---
name: hub-collab
description: Orchestrate a multi-agent collaboration demo on the Thoughtbox Hub. Spawns COORDINATOR, ARCHITECT, and DEBUGGER agents that coordinate through shared workspaces, problems, proposals, and channels.
user_invocable: true
---

# Hub Collaboration Demo

Orchestrate a multi-agent demo showing 3 agents (COORDINATOR, ARCHITECT, DEBUGGER) collaborating on the Thoughtbox Hub.

## Prerequisites

Before running, verify:
1. Docker is running and the Thoughtbox server is accessible at `http://localhost:1731/mcp`
2. The `thoughtbox` MCP server is configured in `.mcp.json`

Check with:
```bash
curl -s http://localhost:1731/mcp | head -c 100
```

## MCP Session Behavior (Empirically Verified 2026-02-08)

Sub-agents spawned via the Task tool share the parent's MCP HTTP connection but each `register` call creates a **separate agentId**. Key findings:

1. **Session isolation works**: Each sub-agent gets a unique agentId on the hub
2. **Cross-workspace visibility works**: Sub-agents see workspaces created by other agents
3. **Cross-agent review works**: A Debugger sub-agent can review an Architect's proposal
4. **Coordinator role caveat**: Re-registering creates a new identity, losing coordinator role. The orchestrator must create workspace + problems BEFORE spawning sub-agents, and not re-register afterward if merge is needed.
5. **Background-launch pattern**: Launch the first sub-agent with `run_in_background: true` so it starts working immediately, then launch the second sub-agent while the first is still alive. This gives you concurrent execution without the identity conflicts of truly parallel Task calls. Once a sub-agent's Task completes, its hub identity is permanently gone — both agents must finish all hub operations before returning.

### MCP Tool Access in Sub-Agents (CRITICAL — researched 2026-02-08)

**DO NOT use `mcpServers:` in agent frontmatter.** Sub-agents inherit all parent MCP tools automatically. Declaring `mcpServers` causes "Tool names must be unique" API errors because the same tools get registered twice (inherited + declared, no dedup).

**Correct pattern**: Remove `mcpServers` from agent frontmatter. Sub-agents access MCP tools via `ToolSearch` at runtime, just like the `general-purpose` agent type.

**Known Claude Code bug**: [#10668](https://github.com/anthropics/claude-code/issues/10668), [#10704](https://github.com/anthropics/claude-code/issues/10704), [#21560](https://github.com/anthropics/claude-code/issues/21560). Not fixed as of Feb 2026.

**Agent caching**: Claude Code caches agent definitions at session start. Changes to `.claude/agents/*.md` files require a new session to take effect. New agent files created mid-session are not discoverable.

**Two approaches:**

### Approach A: Single-Session Orchestration (Recommended)
Parent session acts as COORDINATOR (registers, creates workspace/problems). First sub-agent launches with `run_in_background: true`, second launches immediately after — both run concurrently with separate identities. Cross-agent review works. Merge requires the parent to maintain its original coordinator identity.

### Approach B: Multi-Process Demo (CLI agents)
Each agent runs as a separate `claude --agent` process. Fully independent MCP connections with no shared state concerns. Best for video demos where you want visible parallel terminals.

For Approach B, open 3 terminal tabs and run:
```bash
# Terminal 1 - Coordinator
claude --agent hub-coordinator -p "Register on the hub, create workspace 'demo-collab' with description 'Demo of multi-agent collaboration'. Create 2 problems: (1) 'Design caching strategy' - a design problem for the architect, (2) 'Fix profile priming bug' - a bug where profile content is appended to every thought response instead of just once. Report the workspace ID and problem IDs."

# Terminal 2 - Architect (after Coordinator reports workspace ID)
claude --agent hub-architect -p "Register on the hub, join workspace '<WORKSPACE_ID>'. Claim the design problem, analyze the codebase for caching patterns, create a thought chain with your analysis, and submit a proposal."

# Terminal 3 - Debugger (after Coordinator reports workspace ID)
claude --agent hub-debugger -p "Register on the hub, join workspace '<WORKSPACE_ID>'. Claim the bug problem about profile priming. Investigate gateway-handler.ts lines 504-516. Use five-whys on your branch. Review the Architect's proposal when it's ready."
```

## Approach A: Single-Session Orchestration

When this skill is invoked, execute the following steps sequentially. Each step uses the `thoughtbox_hub` tool directly (since we're in the parent session).

### Step 1: Register as Coordinator
```
thoughtbox_hub { operation: "register", args: { name: "Orchestrator", profile: "COORDINATOR" } }
```
Record the agentId.

### Step 2: Create Workspace
```
thoughtbox_hub { operation: "create_workspace", args: {
  name: "demo-collaboration",
  description: "Demonstration of multi-agent hub collaboration with problem decomposition, proposals, and reviews"
} }
```
Record the workspaceId.

### Step 3: Create Problems
Create 2 problems with a dependency:

**Problem 1 - Design:**
```
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "Design caching strategy for thought retrieval",
  description: "Analyze current thought retrieval patterns and design a caching layer to reduce filesystem reads. Consider: cache invalidation, memory bounds, branch-aware caching."
} }
```

**Problem 2 - Bug:**
```
thoughtbox_hub { operation: "create_problem", args: {
  workspaceId: "<ID>",
  title: "Fix profile priming on every thought call",
  description: "BUG: gateway-handler.ts:504-516 appends full mental model payload to EVERY thought response. Should only prime once per session. Root cause analysis needed."
} }
```

### Step 4: Launch Architect in Background (Task tool)
Use Task tool with subagent_type matching the hub-architect agent. Set `run_in_background: true`.
```
Prompt: "You are the ARCHITECT agent. Register on the hub, join workspace <ID>. Check ready_problems, claim the design problem. Initialize the gateway, create a thought chain analyzing caching approaches. Create a proposal with your design recommendation. Post a summary to the problem channel.

IMPORTANT: Once you return, your hub identity is permanently gone. Complete ALL hub operations (proposal submission, channel posts) before returning."
```

Do **not** wait for the Architect to complete. Proceed immediately to Step 5.

### Step 5: Launch Debugger (Task tool)
Launch immediately after Step 4. The Architect is already running in the background.

Use Task tool with subagent_type matching the hub-debugger agent:
```
Prompt: "You are the DEBUGGER agent. Register on the hub, join workspace <ID>. Check ready_problems, claim the bug problem. Initialize the gateway, use five-whys investigation on the profile priming bug in gateway-handler.ts. Create a proposal with your fix.

The Architect is running concurrently in the background. Poll the hub for its proposal (list_proposals) with retries — interleave polling with your own investigation work rather than blocking. If no proposal appears after 5+ attempts, the Architect may need more turns. Review the Architect's proposal when it appears.

IMPORTANT: Once you return, your hub identity is permanently gone. Complete ALL hub operations (proposal, review, channel posts) before returning."
```

### Step 5.5: Monitor Agent Completion
Use `TaskOutput` to check on the background Architect agent and collect its results. Wait for both agents to finish before proceeding.

**Tuning**: If either agent exhausts `max_turns` before completing hub work, increase `max_turns` (default 25) and re-run that agent.

### Step 6: Report Status
```
thoughtbox_hub { operation: "workspace_status", args: { workspaceId: "<ID>" } }
```

Report the final state: agents registered, problems created/claimed, proposals submitted, channels active.

## Expected Demo Output

A successful run demonstrates:
- Agent registration with profiles (COORDINATOR, ARCHITECT, DEBUGGER)
- Workspace creation and joining
- Problem decomposition with dependencies
- Branch-based investigation (thought chains)
- Proposal creation linked to thought evidence
- Cross-agent review (both approaches — verified empirically)
- Channel communication with thought references
- Workspace status showing coordinated progress
