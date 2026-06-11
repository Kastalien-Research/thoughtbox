---
name: team
description: Orchestrate an Agent Teams session with Thoughtbox as the reasoning substrate
user_invocable: true
---

# /team — Agent Teams Orchestration

Spawn and coordinate an Agent Teams session backed by Thoughtbox Hub.

## Usage

```
/team <task description>
```

## What This Skill Does

1. **Creates a Thoughtbox workspace** for the task
2. **Decomposes the task** into problems with dependencies
3. **Spawns teammates** with appropriate profiles and workspace ID
4. **Monitors progress** via `tb.hub.workspaceDigest` and Observatory

## Hub Surface

The hub is exposed as `tb.hub.*` inside the `thoughtbox_execute` MCP tool. Register once per MCP session — the returned agentId is implicit for every later hub call in that session, and coordinator role is bound to it (do not re-register; merges must run from this session). Submit at most ONE state-mutating hub call per `thoughtbox_execute` invocation; read-only calls (`tb.hub.whoami`, `tb.hub.listWorkspaces`, `tb.hub.readChannel`, `tb.hub.workspaceDigest`) may be freely chained.

## Workflow

### Step 1: Bootstrap

Register as coordinator, then create the workspace (one `thoughtbox_execute` call each):

```js
async () => tb.hub.register({ name: "Lead", profile: "MANAGER" })
```

```js
async () => tb.hub.createWorkspace({ name: "<task-name>", description: "<task-description>" })
```

### Step 2: Decompose

Analyze the task and create problems:

```js
async () => tb.hub.createProblem({ workspaceId: "<ws-id>", title: "...", description: "..." })
```

Add dependencies between problems if needed:

```js
async () => tb.hub.addDependency({ workspaceId: "<ws-id>", problemId: "<dependent>", dependsOnProblemId: "<blocker>" })
```

### Step 3: Spawn Teammates

Use the spawn prompt templates from `.Codex/team-prompts/` to create teammates. Replace `{{WORKSPACE_ID}}` with the actual workspace ID.

Recommended team compositions:
- **Feature work**: Architect + Reviewer
- **Bug investigation**: Debugger + Researcher
- **Full project**: Architect + Debugger + Reviewer

### Step 4: Monitor

Periodically check progress:

```js
async () => tb.hub.workspaceDigest({ workspaceId: "<ws-id>" })
```

### Step 5: Resolve

When all problems are resolved and proposals are merged (`tb.hub.mergeProposal` from this coordinator session), summarize outcomes.
