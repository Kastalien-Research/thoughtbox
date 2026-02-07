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

## Important: MCP Session Isolation

Sub-agents spawned via the Task tool share the parent's MCP connection. This means they share the same agentId on the hub, which prevents true multi-agent coordination (one agent can't review another's proposal if they share an identity).

**Two approaches:**

### Approach A: Single-Session Demo (Task tool)
All agents share the parent's hub identity. Demonstrates the hub API and workflow, but can't show cross-agent review/merge. Good for showing the API surface.

### Approach B: Multi-Process Demo (CLI agents)
Each agent runs as a separate `claude --agent` process in its own terminal. Each gets a separate MCP connection → separate agentId. This enables true multi-agent coordination.

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

Note: In Approach A, the Debugger cannot review the Architect's proposal because they share the same agentId (self-review is blocked). This limitation demonstrates why Approach B is needed for the full demo.

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
- Cross-agent review (Approach B only)
- Channel communication with thought references
- Workspace status showing coordinated progress
