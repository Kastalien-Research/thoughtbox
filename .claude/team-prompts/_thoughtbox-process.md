# Thoughtbox Working Process (MANDATORY)

You MUST use Thoughtbox throughout your work — reasoning (`tb.thought`) and coordination (`tb.hub.*`) — not just at bootstrap and completion, but at every phase transition.

The only registered Thoughtbox MCP tools are `thoughtbox_search`, `thoughtbox_execute`, and `thoughtbox_peer_notebook`. All hub and thought operations run as JavaScript against the `tb` SDK inside `thoughtbox_execute`. Submit at most ONE state-mutating call (`tb.thought`, `tb.hub.quickJoin`, `tb.hub.postMessage`, etc.) per `thoughtbox_execute` invocation; read-only calls (`tb.hub.whoami`, `tb.hub.listWorkspaces`, `tb.hub.readChannel`, `tb.session.*`) may be freely chained.

## Bootstrap (Step 1 — before ANY other work)

```
ToolSearch: "thoughtbox execute"
```

Then complete these steps in order (one state-mutating `thoughtbox_execute` call each):

```js
// 1. Register and join the workspace (once per MCP session). Record the
//    agentId from the result: you may share the MCP connection with the
//    team-lead and other teammates, and the FIRST registration in the
//    session is the implicit default identity for agentId-less calls.
//    Pass YOUR agentId explicitly in every later tb.hub call so your work
//    is attributed to you.
async () => tb.hub.quickJoin({ name: "{{AGENT_NAME}}", workspaceId: "{{WORKSPACE_ID}}", profile: "{{PROFILE}}" })
```

2. Read the `thoughtbox://cipher` MCP resource to load cipher notation.

```js
// 3. Record your starting thought
async () => tb.thought({ thought: "Starting work on {{TASK}}", thoughtType: "reasoning", nextThoughtNeeded: true })
```

```js
// 4. Announce yourself on the problem channel (agentId from step 1)
async () => tb.hub.postMessage({ agentId: "<your agentId>", workspaceId: "{{WORKSPACE_ID}}", problemId: "{{PROBLEM_ID}}", content: "{{AGENT_NAME}} joined. Starting {{TASK}}." })
```

DO NOT proceed until all four steps succeed. Do NOT re-register if a call fails downstream — re-registering creates a new agentId and orphans your first identity.

## During Work — Record Thoughts at Each Phase

Use cipher notation (loaded via the `thoughtbox://cipher` resource above).

| Phase | When | Thought content |
|-------|------|----------------|
| Plan | Before investigating | What you're looking for and why |
| Observe | After reading code/data | What you found — facts, not opinions |
| Decide | Before making a change | What you'll change and the rationale |
| Act | After making changes | What you changed and the outcome |
| Verify | After testing | Pass/fail results and implications |

Example: `tb.thought({ thought: "S2|O|S1|Found 6 emit() calls with incomplete data. L156 only has title...", thoughtType: "reasoning", nextThoughtNeeded: true })`

## During Work — Post to Hub at Phase Transitions

Post to the problem channel (`tb.hub.postMessage`, always passing your explicit `agentId` from bootstrap step 1) when:
- You start a new group of changes
- You complete a group of changes
- You find something unexpected
- You need input from another agent
- You finish all work

Keep posts concise but specific — another agent reading only the channel should understand what happened.

## At Completion

1. Record a final thought with summary and outcome
2. Post completion report to the Hub channel with specific details (what changed, what was verified)
3. Report to team-lead via SendMessage

## IMPORTANT: subagent_type must be "general-purpose"

Agent Teams teammates spawned with custom subagent_types (triage-fix, verification-judge, etc.) do NOT receive ToolSearch and cannot access MCP tools. Always spawn as `subagent_type: "general-purpose"` and put role-specific instructions in the prompt.
