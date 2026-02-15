# Real Multi-Agent Collaboration with Thoughtbox

**Status**: Partially Implemented (Task operations ready, full integration in progress)
**Timeline**: Ready for demo in 2 weeks

---

## How It Works

When you use Thoughtbox for reasoning while coordinating sub-agents, the Observatory visualizes the collaboration in real-time.

### The Flow

```
You (Main Agent)
  ↓
1. Create a task in Thoughtbox
2. Contribute planning thoughts
3. Spawn sub-agents for specialized work
4. Sub-agents contribute their thoughts
5. You synthesize the results
  ↓
Observatory shows this happening live!
```

---

## Basic Usage (Available Now)

### Step 1: Create a Task

```typescript
thoughtbox_gateway({
  operation: 'task',
  args: {
    action: 'create',
    taskId: 'code-review-auth',
    title: 'Code Review: Authentication Module',
    subtasks: [
      { id: 'security', title: 'Security Review', status: 'pending' },
      { id: 'performance', title: 'Performance Analysis', status: 'pending' },
      { id: 'style', title: 'Style Check', status: 'pending' }
    ]
  }
})
```

**What happens**: Task board appears in Observatory showing your task and subtasks.

### Step 2: Register Yourself as an Agent

```typescript
thoughtbox_gateway({
  operation: 'task',
  args: {
    action: 'register_agent',
    agentId: 'main-orchestrator',
    agentRole: 'orchestrator',
    taskId: 'code-review-auth'
  }
})
```

**What happens**: Purple "Orchestrator" pill appears in Observatory header.

### Step 3: Contribute Thoughts with Attribution

```typescript
thoughtbox_gateway({
  operation: 'thought',
  args: {
    thought: 'S1|P|—|Decomposing code review into 3 parallel specialist reviews',
    nextThoughtNeeded: true,
    agentId: 'main-orchestrator',
    agentRole: 'orchestrator',
    taskId: 'code-review-auth'
  }
})
```

**What happens**: Purple-colored thought node appears in graph (orchestrator color).

### Step 4: Spawn Sub-Agents and Have Them Register

When you spawn sub-agents via Task tool, have each one register:

```typescript
// In your prompt to the sub-agent, include:
"When you start working, register yourself:
thoughtbox_gateway({
  operation: 'task',
  args: {
    action: 'register_agent',
    agentId: 'security-reviewer-1',
    agentRole: 'reviewer',
    taskId: 'code-review-auth'
  }
})

Then contribute your findings with:
thoughtbox_gateway({
  operation: 'thought',
  args: {
    thought: 'S2|E|S1|Found SQL injection vulnerability...',
    nextThoughtNeeded: true,
    agentId: 'security-reviewer-1',
    agentRole: 'reviewer',
    taskId: 'code-review-auth'
  }
})"
```

**What happens**:
- Amber "Reviewer" pill appears
- Amber-colored thought appears when they contribute
- Agent pill pulses while active

### Step 5: Update Task Progress

```typescript
thoughtbox_gateway({
  operation: 'task',
  args: {
    action: 'update',
    taskId: 'code-review-auth',
    subtasks: [
      { id: 'security', title: 'Security Review', status: 'completed', assignedTo: 'security-reviewer-1' },
      { id: 'performance', title: 'Performance Analysis', status: 'in_progress' },
      { id: 'style', title: 'Style Check', status: 'pending' }
    ],
    progress: 0.33
  }
})
```

**What happens**: Task board updates, progress bar fills to 33%, Security subtask shows ✓.

---

## Complete Example Workflow

### Scenario: Code Review with 3 Specialists

```typescript
// You (main agent) create the coordination structure
await thoughtbox_gateway({ operation: 'task', args: {
  action: 'create',
  taskId: 'review-pr-123',
  title: 'Review PR #123: Add OAuth',
  subtasks: [
    { id: 'sec', title: 'Security', status: 'pending' },
    { id: 'perf', title: 'Performance', status: 'pending' },
    { id: 'style', title: 'Style', status: 'pending' }
  ]
}});

await thoughtbox_gateway({ operation: 'task', args: {
  action: 'register_agent',
  agentId: 'orchestrator-main',
  agentRole: 'orchestrator',
  taskId: 'review-pr-123'
}});

// Plan the work
await thoughtbox_gateway({ operation: 'thought', args: {
  thought: 'S1|P|—|Spawning 3 parallel reviewers for comprehensive analysis',
  nextThoughtNeeded: true,
  agentId: 'orchestrator-main',
  agentRole: 'orchestrator',
  taskId: 'review-pr-123'
}});

// Spawn sub-agents (via Task tool)
// Security Reviewer
const securityAgent = await Task({
  subagent_type: 'general-purpose',
  description: 'Security review',
  prompt: `Review this PR for security issues.

1. Register yourself:
thoughtbox_gateway({ operation: 'task', args: {
  action: 'register_agent',
  agentId: 'security-agent-1',
  agentRole: 'reviewer',
  taskId: 'review-pr-123'
}})

2. Contribute findings:
thoughtbox_gateway({ operation: 'thought', args: {
  thought: 'S2|E|S1|Your security findings here...',
  nextThoughtNeeded: true,
  agentId: 'security-agent-1',
  agentRole: 'reviewer',
  taskId: 'review-pr-123'
}})

3. Update progress when done:
thoughtbox_gateway({ operation: 'task', args: {
  action: 'update',
  taskId: 'review-pr-123',
  subtasks: [
    { id: 'sec', title: 'Security', status: 'completed', assignedTo: 'security-agent-1' },
    ...
  ],
  progress: 0.33
}})`
});

// Similarly spawn performance and style reviewers...

// After all complete, synthesize
await thoughtbox_gateway({ operation: 'thought', args: {
  thought: 'S5|C|S2-S4|Synthesis of all findings: ...',
  nextThoughtNeeded: false,
  agentId: 'orchestrator-main',
  agentRole: 'orchestrator',
  taskId: 'review-pr-123'
}});

await thoughtbox_gateway({ operation: 'task', args: {
  action: 'complete',
  taskId: 'review-pr-123'
}});
```

**Observatory Shows**:
- 4 agent pills (1 purple orchestrator, 3 amber reviewers)
- Task board with real-time progress
- Color-coded thought contributions
- Agents pulsing when active

---

## Agent Role Colors

| Role | Color | Use For |
|------|-------|---------|
| Orchestrator | 🟣 Purple | Main coordinating agent |
| Researcher | 🔵 Blue | Information gathering, web search, docs |
| Architect | 🔷 Cyan | Design decisions, system architecture |
| Implementer | 🟢 Emerald | Code writing, artifact creation |
| Reviewer | 🟡 Amber | Code review, validation, critique |
| Tester | 🔴 Red | Running tests, QA |
| Integrator | 🩷 Pink | Combining results, synthesis |
| Critic | 🟣 Indigo | Challenging assumptions, finding edge cases |

---

## Future: True Distributed Collaboration (Option 2)

When SPEC-REASONING-TASKS is fully implemented:

### Two Claude Code Instances Collaborating

**Instance A** (Developer 1):
```bash
# Create shared task (git-tracked)
thoughtbox_gateway({ operation: 'task', args: {
  action: 'create',
  taskId: 'feature-auth-system',
  title: 'Implement Authentication System'
}})

# Claim frontend subtask
thoughtbox_gateway({ operation: 'task', args: {
  action: 'claim',
  taskId: 'feature-auth-system',
  subtaskId: 'frontend',
  agentId: 'dev1-main'
}})
```

**Instance B** (Developer 2):
```bash
# Load the same task (from git-tracked file)
thoughtbox_gateway({ operation: 'task', args: {
  action: 'get',
  taskId: 'feature-auth-system'
}})

# Claim backend subtask
thoughtbox_gateway({ operation: 'task', args: {
  action: 'claim',
  taskId: 'feature-auth-system',
  subtaskId: 'backend',
  agentId: 'dev2-main'
}})
```

Both instances update the shared task file, commit progress, and the knowledge graph accumulates learnings from both!

---

## Tips for Effective Collaboration

1. **Always register agents** - Makes visualization meaningful
2. **Use descriptive task titles** - Shows up in task board
3. **Update progress regularly** - Keeps visualization current
4. **Identify yourself in thoughts** - Colors make patterns visible
5. **Complete tasks** - Triggers final events and metrics

---

## Troubleshooting

### Agent Pills Not Appearing

Check that you registered the agent:
```typescript
thoughtbox_gateway({ operation: 'task', args: {
  action: 'register_agent',
  agentId: 'your-agent-id',
  agentRole: 'reviewer', // Must be valid role
  taskId: 'your-task-id'
}})
```

### Thoughts Not Colored

Include agent attribution in every thought:
```typescript
thoughtbox_gateway({ operation: 'thought', args: {
  thought: '...',
  nextThoughtNeeded: true,
  agentId: 'your-agent-id',      // Required for coloring
  agentRole: 'reviewer',          // Required for coloring
  taskId: 'your-task-id'          // Optional but helpful
}})
```

### Task Board Not Showing

Ensure task was created and has subtasks:
```typescript
thoughtbox_gateway({ operation: 'task', args: {
  action: 'create',
  title: 'Your Task',
  subtasks: [
    { id: 'st1', title: 'Step 1', status: 'pending' }
  ]
}})
```

---

## What's Next

### For 2-Week Demo

1. ✅ **Mock visualization** - Working now
2. 🚧 **Real task operations** - Partially implemented
3. **Full integration** - Wire sub-agent spawning to auto-register
4. **Polish UI** - Add agent avatars, better animations
5. **Real demo** - Live multi-agent collaboration

### Beyond

1. **Persistent tasks** (SPEC-REASONING-TASKS Phase 1)
2. **Knowledge graph** (SPEC-KNOWLEDGE-MEMORY Phase 1)
3. **Cross-instance collaboration** (Option 2)
4. **Conflict resolution visualization** - Show deliberation sessions
5. **Agent timeline** - Gantt chart view

---

## Current Capabilities Matrix

| Feature | Mock | Real | Notes |
|---------|------|------|-------|
| Agent activity pills | ✅ | ✅ | Works with register_agent |
| Task board | ✅ | ✅ | Works with task operations |
| Colored thoughts | ✅ | ✅ | Works with thought attribution |
| Real-time updates | ✅ | ✅ | WebSocket events |
| Sub-agent auto-register | ❌ | 🚧 | Need to add hooks |
| Persistent tasks | ❌ | 🚧 | Simple in-memory only |
| Knowledge extraction | ❌ | ❌ | Future (requires sqlite) |
| Cross-instance collab | ❌ | ❌ | Future (Option 2) |

---

## Demo Scenarios

### Scenario 1: Code Review (Works Now!)

Use the manual workflow above - create task, register agents, contribute thoughts with attribution. Perfect for showing the visualization concept.

### Scenario 2: Research Task (Future)

Orchestrator spawns multiple researchers, each queries different sources (Exa, Context7, codebase), contributes findings, synthesizer combines results.

### Scenario 3: Design Iteration (Future)

Designer proposes, multiple reviewers (UX, A11y, Brand) provide feedback in parallel, designer refines based on synthesis.

---

For questions or issues, see:
- [SPEC-COLLAB-VIZ-MVP.md](../dgm-specs/SPEC-COLLAB-VIZ-MVP.md) - Visualization spec
- [SPEC-REASONING-TASKS.md](../dgm-specs/SPEC-REASONING-TASKS.md) - Full task system
- [DEMO-INSTRUCTIONS.md](../DEMO-INSTRUCTIONS.md) - Mock demo script
