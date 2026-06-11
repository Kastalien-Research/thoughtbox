# /deploy-team — Hub-Integrated Agent Team Deployment

Deploy a multi-agent team that coordinates through Thoughtbox Hub.

## Usage

```
/deploy-team <issue-id-or-description>
```

## Why This Exists

When the coordinator registers on the Hub before spawning agents, the spawn prompts naturally include Hub bootstrap instructions. When the coordinator skips Hub registration and goes straight to exploration, the spawn prompts omit Hub integration entirely. This command codifies the sequence that works.

## Hub Surface

The hub is exposed as `tb.hub.*` inside the `thoughtbox_execute` MCP tool (the only registered Thoughtbox MCP tools are `thoughtbox_search`, `thoughtbox_execute`, and `thoughtbox_peer_notebook`). Register once per MCP session; the returned agentId is implicit for every later hub call in that session. Submit at most ONE state-mutating hub call per `thoughtbox_execute` invocation; read-only calls (`tb.hub.whoami`, `tb.hub.listWorkspaces`, `tb.hub.readChannel`, `tb.hub.workspaceStatus`) may be freely chained.

## Prerequisites (VERIFY BEFORE ANYTHING ELSE)

Before spawning ANY agent, verify these are true:

```bash
# Every agent definition must have ToolSearch in tools:
grep ToolSearch .Codex/agents/*.md
```

If ANY agent file is missing ToolSearch, add it and COMMIT the change. Do not proceed until committed. Uncommitted changes get lost.

## Coordinator Startup Sequence

Execute these steps in this order. Do not skip ahead to exploration or spawning.

### 1. Register on the Hub

```js
// thoughtbox_execute
async () => tb.hub.register({ name: "Coordinator", profile: "MANAGER" })
```

Do NOT re-register later in the session — coordinator role is bound to this agentId, and `tb.hub.mergeProposal` must run from this same session.

### 2. Create the workspace

```js
async () => tb.hub.createWorkspace({ name: "<branch-name>", description: "<what we're doing and why>" })
```

### 3. Decompose into problems

Create Hub problems with dependency chains (one mutation per `thoughtbox_execute` call).

```js
async () => tb.hub.createProblem({ workspaceId: "...", title: "...", description: "..." })
```

```js
async () => tb.hub.addDependency({ workspaceId: "...", problemId: "...", dependsOnProblemId: "..." })
```

### 4. Explore and research

Now do technical analysis. The workspace already exists, so findings get recorded there.

### 5. Spawn agents with MANDATORY Thoughtbox bootstrap

Every agent spawn prompt MUST include the following as **Step 1**, before ANY implementation work:

```
## Step 1: Bootstrap Thoughtbox (DO THIS FIRST — before any code changes)

Use ToolSearch to load mcp__thoughtbox__thoughtbox_execute. All hub and thought
operations are JavaScript against the `tb` SDK inside thoughtbox_execute — one
state-mutating call per invocation. Run these in order:

1. async () => tb.hub.quickJoin({ name: "<agent-name>", workspaceId: "<ID>", profile: "<PROFILE>" })
   Record the agentId from the result. You share the MCP session with the
   team-lead and other agents — the FIRST registration in the session is the
   implicit default identity, so you MUST pass your own agentId explicitly in
   every later tb.hub call or your work is attributed to another agent.
2. Read the `thoughtbox://cipher` MCP resource for cipher notation.
3. async () => tb.thought({ thought: "Starting work on <task description>", thoughtType: "reasoning", nextThoughtNeeded: true })
4. async () => tb.hub.postMessage({ agentId: "<your agentId>", workspaceId: "<ID>", problemId: "<ID>", content: "Joined and starting work on <task>" })

DO NOT proceed to Step 2 until all four steps succeed. If any call fails, report
the error. Do NOT re-register — that creates a new agentId.
```

Additionally, throughout their work agents MUST:
- Record key decisions as thoughts via `tb.thought(...)`
- Post progress updates to hub channels via `tb.hub.postMessage({ agentId, ... })`
- Update problem status when claiming/completing work (`tb.hub.claimProblem({ agentId, ... })`, `tb.hub.updateProblem({ agentId, ... })`)

### 6. Verification gate (MANDATORY — 90 seconds after spawn)

After spawning all agents, wait 90 seconds, then verify hub integration (both calls are read-only and may be chained in one `thoughtbox_execute`):

```js
async () => {
  // Workspace overview — all agents should appear
  const status = await tb.hub.workspaceStatus({ workspaceId: "<ID>" });
  // Channel messages — each agent should have posted at least one
  const channel = await tb.hub.readChannel({ workspaceId: "<ID>", problemId: "<first-problem-ID>" });
  return { status, channel };
}
```

**If ANY agent has NOT posted to the hub within 90 seconds:**
1. Send the agent a message asking for status
2. Wait 30 more seconds
3. If still no hub activity, KILL the agent and respawn with the same prompt
4. Do NOT proceed to monitoring until all agents are confirmed active on the hub

This gate is non-negotiable. The entire purpose of Agent Teams is hub coordination. An agent that isn't on the hub is not doing its job.

### 7. Monitor and coordinate

Post coordination decisions to channels. Create consensus markers for architectural decisions (`tb.hub.markConsensus`). Review proposals from other agents (`tb.hub.reviewProposal`).

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

1. Record consensus on the Hub workspace (`tb.hub.markConsensus` — `thoughtRef` is a thought number)
2. Update hypotheses doc with results
3. Note findings about the coordination process itself — these improve the next run

## Lessons from Previous Runs

- **Run 003**: Used Task sub-agents instead of TeamCreate. Sub-agents have no inter-agent communication. Use TeamCreate.
- **Run 004**: Agents lacked ToolSearch in tool whitelists. Hub instructions in spawn prompts were impossible to follow. Fixed and committed at 09a6224.
- **Run 004**: Coordinator shut down first, stranding other teammates. Always shut down coordinator last.
- **Run 004**: Hub integration not verified until late in the run. By then it was too late. Verify within 90 seconds.
- **Run 004**: User's hand-edits to agent files were lost (uncommitted). Always commit agent definition changes before spawning.
- **Agent definitions are cached at session start.** Changes to .Codex/agents/*.md mid-session have NO effect. Must start a new session.
- **In-process teammates cannot be force-killed.** They run until maxTurns exhaustion. Always use run_in_background: true.
