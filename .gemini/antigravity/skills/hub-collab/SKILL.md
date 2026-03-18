---
name: hub-collab
description: Orchestrate a multi-agent collaboration demo on the Thoughtbox Hub. Spawns MANAGER, ARCHITECT, and DEBUGGER agents that coordinate through shared workspaces, problems, proposals, and channels.
user_invocable: true
---

# Hub Collaboration Demo

Orchestrate a multi-agent demo showing 3 agents (MANAGER, ARCHITECT, DEBUGGER) collaborating on the Thoughtbox Hub.

## Prerequisites

Before running, verify:
1. Docker is running and the Thoughtbox server is accessible at `http://localhost:1731/mcp`
2. The `thoughtbox` MCP server is configured in `.mcp.json`

Check with:
```bash
curl -s http://localhost:1731/mcp | head -c 100
```

## MCP Session Behavior (Empirically Verified 2026-02-07)

Sub-agents spawned via the Task tool share the parent's MCP HTTP connection but each `register` call creates a **separate agentId**. Key findings:

1. **Session isolation works**: Each sub-agent gets a unique agentId on the hub
2. **Cross-workspace visibility works**: Sub-agents see workspaces created by other agents
3. **Cross-agent review works**: A Debugger sub-agent can review an Architect's proposal
4. **Coordinator role caveat**: Re-registering creates a new identity, losing coordinator role. The orchestrator must create workspace + problems BEFORE spawning sub-agents, and not re-register afterward if merge is needed.
5. **Sequential spawning recommended**: Run sub-agents sequentially (not in parallel) to avoid identity overwrites on the shared connection. Each agent should complete registration → join → claim → propose before the next starts.

**Two approaches:**

### Approach A: Single-Session Orchestration (Recommended)
Parent session acts as MANAGER (registers, creates workspace/problems). Sub-agents spawn sequentially via Task tool, each registering with their own identity. Cross-agent review works. Merge requires the parent to maintain its original coordinator identity.

### Approach B: Multi-Process Demo (CLI agents)
Each agent runs as a separate `claude --agent` process. Fully independent MCP connections with no shared state concerns. Best for video demos where you want visible parallel terminals.

For Approach B, open 3 terminal tabs and run:
```bash
# Terminal 1 - Manager
claude --agent hub-manager -p "Register on the hub, create workspace 'demo-collab' with description 'Demo of multi-agent collaboration'. Create 2 problems: (1) 'Design caching strategy' - a design problem for the architect, (2) 'Fix profile priming bug' - a bug where profile content is appended to every thought response instead of just once. Report the workspace ID and problem IDs."

# Terminal 2 - Architect (after Manager reports workspace ID)
claude --agent hub-architect -p "Register on the hub, join workspace '<WORKSPACE_ID>'. Claim the design problem, analyze the codebase for caching patterns, create a thought chain with your analysis, and submit a proposal."

# Terminal 3 - Debugger (after Manager reports workspace ID)
claude --agent hub-debugger -p "Register on the hub, join workspace '<WORKSPACE_ID>'. Claim the bug problem about profile priming. Investigate gateway-handler.ts lines 504-516. Use five-whys on your branch. Review the Architect's proposal when it's ready."
```

## Approach A: Single-Session Orchestration

When this skill is invoked, execute the following steps sequentially. Each step uses the `thoughtbox_hub` tool directly (since we're in the parent session).

### Step 1: Register as Manager
```
thoughtbox_hub { operation: "register", args: { name: "Orchestrator", profile: "MANAGER" } }
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

### Step 4: Spawn Architect (Task tool)
Use Task tool with subagent_type matching the hub-architect agent:
```
Prompt: "You are the ARCHITECT agent. Register on the hub, join workspace <ID>. Check ready_problems, claim the design problem. Initialize the gateway, create a thought chain analyzing caching approaches. Create a proposal with your design recommendation. Post a summary to the problem channel."
```

### Step 5: Spawn Debugger (Task tool)
Use Task tool with subagent_type matching the hub-debugger agent:
```
Prompt: "You are the DEBUGGER agent. Register on the hub, join workspace <ID>. Check ready_problems, claim the bug problem. Initialize the gateway, use five-whys investigation on the profile priming bug in gateway-handler.ts. Create a proposal with your fix. Review the Architect's proposal if one exists."
```

**Important**: Spawn Architect FIRST, wait for completion, then spawn Debugger. Sequential spawning prevents identity overwrites on the shared MCP connection. The Debugger can review the Architect's proposal because they have different agentIds.

### Step 6: Report Status
```
thoughtbox_hub { operation: "workspace_status", args: { workspaceId: "<ID>" } }
```

Report the final state: agents registered, problems created/claimed, proposals submitted, channels active.

## Expected Demo Output

A successful run demonstrates:
- Agent registration with profiles (MANAGER, ARCHITECT, DEBUGGER)
- Workspace creation and joining
- Problem decomposition with dependencies
- Branch-based investigation (thought chains)
- Proposal creation linked to thought evidence
- Cross-agent review (both approaches — verified empirically)
- Channel communication with thought references
- Workspace status showing coordinated progress
