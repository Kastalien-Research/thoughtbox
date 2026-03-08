# /deploy-team — Hub-Integrated Agent Team Deployment

Deploy a multi-agent team that coordinates through Thoughtbox Hub.

## Usage

```
/deploy-team <issue-id-or-description>
```

## Why This Exists

When the coordinator registers on the Hub before spawning agents, the spawn prompts naturally include Hub bootstrap instructions. When the coordinator skips Hub registration and goes straight to exploration, the spawn prompts omit Hub integration entirely. This command codifies the sequence that works.

## Prerequisites (VERIFY BEFORE ANYTHING ELSE)

Before spawning ANY agent, verify these are true:

```bash
# Every agent definition must have ToolSearch in tools:
grep ToolSearch .claude/agents/*.md
```

If ANY agent file is missing ToolSearch, add it and COMMIT the change. Do not proceed until committed. Uncommitted changes get lost.

## Coordinator Startup Sequence

Execute these steps in this order. Do not skip ahead to exploration or spawning.

### 1. Register on the Hub

```
thoughtbox_hub { operation: "register", args: { "name": "Coordinator", "profile": "MANAGER" } }
```

### 2. Create the workspace

```
thoughtbox_hub { operation: "create_workspace", args: { "name": "<branch-name>", "description": "<what we're doing and why>" } }
```

### 3. Decompose into problems

Create Hub problems with dependency chains.

```
thoughtbox_hub { operation: "create_problem", args: { "workspaceId": "...", "title": "...", "description": "..." } }
```

### 4. Explore and research

Now do technical analysis. The workspace already exists, so findings get recorded there.

### 5. Spawn agents with MANDATORY Thoughtbox bootstrap

Every agent spawn prompt MUST include the following as **Step 1**, before ANY implementation work:

```
## Step 1: Bootstrap Thoughtbox (DO THIS FIRST — before any code changes)

Use ToolSearch to load mcp__thoughtbox__thoughtbox_hub AND mcp__thoughtbox__thoughtbox_gateway.
Then run ALL FOUR of these calls:

1. thoughtbox_hub { operation: "quick_join", args: { name: "<agent-name>", workspaceId: "<ID>", profile: "<PROFILE>" } }
2. thoughtbox_gateway { operation: "cipher" }
3. thoughtbox_gateway { operation: "thought", args: { content: "Starting work on <task description>" } }
4. thoughtbox_hub { operation: "post_message", args: { problemId: "<ID>", content: "Joined and starting work on <task>" } }

DO NOT proceed to Step 2 until all four calls succeed. If any call fails, report the error.
```

Additionally, throughout their work agents MUST:
- Record key decisions as thoughts via `thoughtbox_gateway { operation: "thought" }`
- Post progress updates to hub channels via `thoughtbox_hub { operation: "post_message" }`
- Update problem status when claiming/completing work

### 6. Verification gate (MANDATORY — 90 seconds after spawn)

After spawning all agents, wait 90 seconds, then verify hub integration:

```
# Check workspace members — all agents should appear
thoughtbox_hub { operation: "list_members", args: { workspaceId: "<ID>" } }

# Check channel messages — each agent should have posted at least one
thoughtbox_hub { operation: "read_channel", args: { workspaceId: "<ID>", problemId: "<first-problem-ID>" } }
```

**If ANY agent has NOT posted to the hub within 90 seconds:**
1. Send the agent a message asking for status
2. Wait 30 more seconds
3. If still no hub activity, KILL the agent and respawn with the same prompt
4. Do NOT proceed to monitoring until all agents are confirmed active on the hub

This gate is non-negotiable. The entire purpose of Agent Teams is hub coordination. An agent that isn't on the hub is not doing its job.

### 7. Monitor and coordinate

Post coordination decisions to channels. Create consensus markers for architectural decisions. Review proposals from other agents.

### 8. Shutdown sequence

**Shut down the coordinator LAST.** The coordinator orchestrates shutdown of other teammates. Shutting it down first strands everyone.

Order:
1. Send shutdown_request to all implementation agents
2. Wait for confirmations
3. Send shutdown_request to verification/monitoring agents
4. Wait for confirmations
5. Coordinator shuts down last

## Hypothesis-Driven Development

Before spawning, define testable hypotheses for what the run should produce. Document them on the branch.

## Post-Run

1. Record consensus on the Hub workspace
2. Update hypotheses doc with results
3. Note findings about the coordination process itself — these improve the next run

## Lessons from Previous Runs

- **Run 003**: Used Task sub-agents instead of TeamCreate. Sub-agents have no inter-agent communication. Use TeamCreate.
- **Run 004**: Agents lacked ToolSearch in tool whitelists. Hub/Gateway instructions in spawn prompts were impossible to follow. Fixed and committed at 09a6224.
- **Run 004**: Coordinator shut down first, stranding other teammates. Always shut down coordinator last.
- **Run 004**: Hub integration not verified until late in the run. By then it was too late. Verify within 90 seconds.
- **Run 004**: User's hand-edits to agent files were lost (uncommitted). Always commit agent definition changes before spawning.
- **Agent definitions are cached at session start.** Changes to .claude/agents/*.md mid-session have NO effect. Must start a new session.
- **In-process teammates cannot be force-killed.** They run until maxTurns exhaustion. Always use run_in_background: true.
