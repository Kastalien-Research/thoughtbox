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
4. **Monitors progress** via `workspace_digest` and Observatory

## Workflow

### Step 1: Bootstrap

Register as coordinator and create workspace:

```
thoughtbox_hub { operation: "register", args: { name: "Lead", profile: "MANAGER" } }
thoughtbox_hub { operation: "create_workspace", args: { name: "<task-name>", description: "<task-description>" } }
```

### Step 2: Decompose

Analyze the task and create problems:

```
thoughtbox_hub { operation: "create_problem", args: { workspaceId: "<ws-id>", title: "...", description: "..." } }
```

Add dependencies between problems if needed:

```
thoughtbox_hub { operation: "add_dependency", args: { workspaceId: "<ws-id>", problemId: "<dependent>", dependsOn: "<blocker>" } }
```

### Step 3: Spawn Teammates

Use the spawn prompt templates from `.claude/team-prompts/` to create teammates. Replace `{{WORKSPACE_ID}}` with the actual workspace ID.

Recommended team compositions:
- **Feature work**: Architect + Reviewer
- **Bug investigation**: Debugger + Researcher
- **Full project**: Architect + Debugger + Reviewer

### Step 4: Monitor

Periodically check progress:

```
thoughtbox_hub { operation: "workspace_digest", args: { workspaceId: "<ws-id>" } }
```

### Step 5: Resolve

When all problems are resolved and proposals are merged, summarize outcomes.
