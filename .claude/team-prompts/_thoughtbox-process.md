# Thoughtbox Working Process (MANDATORY)

You MUST use both Thoughtbox Gateway (reasoning) and Thoughtbox Hub (coordination) throughout your work. Not just at bootstrap and completion — at every phase transition.

## Bootstrap (Step 1 — before ANY other work)

```
ToolSearch: "thoughtbox hub"
ToolSearch: "thoughtbox gateway"
mcp__thoughtbox__thoughtbox_hub: { operation: "quick_join", args: { name: "{{AGENT_NAME}}", workspaceId: "{{WORKSPACE_ID}}", profile: "{{PROFILE}}" } }
mcp__thoughtbox__thoughtbox_gateway: { operation: "cipher" }  # Knowledge graph context is auto-injected
mcp__thoughtbox__thoughtbox_gateway: { operation: "thought", args: { content: "Starting work on {{TASK}}" } }
mcp__thoughtbox__thoughtbox_hub: { operation: "post_message", args: { workspaceId: "{{WORKSPACE_ID}}", problemId: "{{PROBLEM_ID}}", content: "{{AGENT_NAME}} joined. Starting {{TASK}}." } }
```

DO NOT proceed until all calls succeed.

## During Work — Record Thoughts at Each Phase

Use cipher notation (loaded via cipher operation above).

| Phase | When | Thought content |
|-------|------|----------------|
| Plan | Before investigating | What you're looking for and why |
| Observe | After reading code/data | What you found — facts, not opinions |
| Decide | Before making a change | What you'll change and the rationale |
| Act | After making changes | What you changed and the outcome |
| Verify | After testing | Pass/fail results and implications |

Example: `thought { content: "S2|O|S1|Found 6 emit() calls with incomplete data. L156 only has title..." }`

## During Work — Post to Hub at Phase Transitions

Post to the problem channel when:
- You start a new group of changes
- You complete a group of changes
- You find something unexpected
- You need input from another agent
- You finish all work

Keep posts concise but specific — another agent reading only the channel should understand what happened.

## At Completion

1. Record a final thought with summary and outcome
2. Post completion report to Hub channel with specific details (what changed, what was verified)
3. Report to team-lead via SendMessage

## IMPORTANT: subagent_type must be "general-purpose"

Agent Teams teammates spawned with custom subagent_types (triage-fix, verification-judge, etc.) do NOT receive ToolSearch and cannot access MCP tools. Always spawn as `subagent_type: "general-purpose"` and put role-specific instructions in the prompt.
