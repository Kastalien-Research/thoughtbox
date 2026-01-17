export const PATTERNS_COOKBOOK = `# Thoughtbox Patterns Cookbook

**Quick Reference Guide for AI Agents**

This guide shows you how to use the Thoughtbox tool flexibly to solve complex problems. The tool supports multiple reasoning patterns without requiring different code - just use the parameters creatively.

---

## Core Concept

**The tool is a thinking workspace, not a methodology.** Thought numbers are logical positions (like chapter numbers), not chronological order. You can jump, branch, revise, and synthesize freely.

### Basic Parameters
- \`thought\`: Your reasoning step
- \`thoughtNumber\`: Logical position (1 to N)
- \`totalThoughts\`: Estimated total (adjustable)
- \`nextThoughtNeeded\`: Continue thinking?

### Extension Parameters
- \`isRevision\`: Updating a previous thought?
- \`revisesThought\`: Which thought to revise
- \`branchFromThought\`: Branch starting point
- \`branchId\`: Branch identifier
- \`includeGuide\`: Request this guide on-demand

---

## Core Patterns

### 1. Forward Thinking (Traditional)

**When to use:** Exploration, discovery, open-ended analysis, brainstorming

**How it works:** Progress sequentially from 1 → 2 → 3 → ... → N

**Example:**
\`\`\`
Thought 1: Identify the problem - "Users complain checkout is slow"
Thought 2: Gather data - "Average checkout: 45 seconds, target: 10 seconds"
Thought 3: Analyze root causes - "3 API calls, 2 database queries, no caching"
Thought 4: Brainstorm solutions - "Add Redis cache, optimize queries, parallel API calls"
Thought 5: Evaluate options - "Caching gives biggest impact for least effort"
Thought 6: Conclusion - "Implement Redis cache for product data"
\`\`\`

**Key:** Let each thought build naturally on the previous one.

---

### 2. Backward Thinking (Goal-Driven)

**When to use:** Planning projects, system design, working from known goals

**How it works:** Start at thought N (desired end), work back to thought 1 (starting point)

**Example:**
\`\`\`
Thought 10: Final state - "API handles 10k req/s with <100ms latency"
Thought 9: Before that - "Load testing completed, autoscaling verified"
Thought 8: Before that - "Monitoring and alerting operational"
Thought 7: Before that - "Caching layer implemented"
...
Thought 1: Starting point - "Current system: 1k req/s, 500ms latency"
\`\`\`

**Key:** For each thought, ask "What must be true immediately before this?"

---

### 3. Branching (Parallel Exploration)

**When to use:** Comparing alternatives, exploring multiple approaches, A/B scenarios

**How it works:** Create separate branches from a common thought

**Parameters:**
\`\`\`javascript
branchFromThought: 5
branchId: "approach-a"  // vs "approach-b"
\`\`\`

**Example:**
\`\`\`
Thought 5: "Need to choose database"

Branch A (thought 6):
branchId: "sql-database"
thought: "Use PostgreSQL - ACID, relations, mature tooling"

Branch B (thought 6):
branchId: "nosql-database"
thought: "Use MongoDB - flexible schema, horizontal scaling"

Later (thought 15):
thought: "Synthesis: Use PostgreSQL for transactions, MongoDB for analytics"
\`\`\`

**Key:** Explore branches independently, then create a synthesis thought.

---

### 4. Revision (Updating Previous Thoughts)

**When to use:** Discovered error, gained new information, refined understanding

**How it works:** Mark a thought as revising a previous one

**Parameters:**
\`\`\`javascript
isRevision: true
revisesThought: 4
\`\`\`

**Example:**
\`\`\`
Thought 4: "Identified 3 stakeholders: developers, users, managers"
...
Thought 9:
isRevision: true
revisesThought: 4
thought: "REVISION: Missed critical stakeholder - security team needs compliance reporting"
\`\`\`

**Key:** Intellectual honesty > appearing perfect. Revise when you learn.

---

### 5. Interleaved Thinking (Reason ↔ Action Loops)

**When to use:** Tool-oriented reasoning; adaptive task execution where thinking and acting must stay synchronized

**How it works:** Alternate between reasoning steps (inside Thoughtbox) and external tool actions. Each reasoning step carries state forward, updates based on tool results, and decides the next move. Continue looping until the task's defined "gates" or checkpoints are reached.

**Example:**
\`\`\`
Thought 1: "TASK: Create plan to refactor app for Vercel AI SDK"
Thought 2: "INVENTORY: List all tools via mcp__* → tooling-inventory.md"
Thought 3: "ASSESS: Tools are sufficient (Firecrawl + Context7 enable info retrieval)"
Thought 4: "STRATEGIZE: Backward-plan steps to produce refactor plan → strategy.md"
Thought 5: "EXECUTE LOOP: Use Thoughtbox to reason, then invoke tools, reason again"
Thought 6: "GATE 1 reached: Draft plan validated, move to next phase"
Thought 7: "GATE 2 reached: Final plan complete"
Thought 8: "FINALIZE: Write final-answer.md, clear folder if requested"
\`\`\`

**Key:** Think → Act → Reflect → Act → Reflect. Maintain reasoning continuity between actions; update strategy dynamically using the results of each tool call.

---

### 6. First Principles Thinking

**When to use:** Innovation, challenging assumptions, deep understanding

**Pattern:** Break down to fundamentals, rebuild from foundation

**Example:**
\`\`\`
Thought 20: "What is authentication really about? Identity verification + access control"
Thought 21: "Identity: Something you know, have, or are (password, token, biometric)"
Thought 22: "Access: Permissions mapped to verified identity"
Thought 23: "From first principles: Need verification system + permission system"
\`\`\`

---

## Combining Patterns

Most complex problems benefit from multiple patterns:

**Example: Architecture Decision**
1. Forward thinking (thoughts 1-10): Explore current system
2. Branching (thoughts 11-20): Compare 3 architecture options
3. Backward thinking (thoughts 21-25): Work back from requirements
4. First principles (thoughts 26-30): Break down to fundamentals
5. Synthesis (thought 31): Make final decision

### Adjusting totalThoughts

Start with an estimate, but adjust freely:

\`\`\`
Thought 1: totalThoughts: 20
...
Thought 15: "Realized this is more complex than expected"
Thought 16: totalThoughts: 40  // Adjusted upward
\`\`\`

---

## Quick Decision Guide

**I need to...**

- **Explore a new problem** → Forward thinking (1→N)
- **Plan a project** → Backward thinking (N→1)
- **Compare options** → Branching + synthesis
- **Fix an error** → Revision
- **Challenge assumptions** → First principles
- **Coordinate reasoning with tool actions** → Interleaved thinking
- **Design architecture** → Backward + branching + synthesis

---

## Best Practices

### 1. Start with Problem Statement
Your thought 1 should clearly define what you're trying to solve.

### 2. Use Backward Thinking for Goals
If you know the destination, work backward to find the path.

### 3. Branch Early for Alternatives
Don't commit to one approach before exploring alternatives.

### 4. Revise Without Shame
Update earlier thoughts when you learn new information.

### 5. Synthesize Explicitly
Don't just end - create synthesis thoughts that integrate your findings.

### 6. Meta-Reflect Periodically
Every 20-30 thoughts, step back and assess your approach.

---

## Common Anti-Patterns

❌ **Sequential rigidity**: Don't force yourself to go 1→2→3 if jumping makes sense

❌ **Over-branching**: More than 4-5 branches becomes hard to synthesize

❌ **Revision abuse**: Constant revision without forward progress is wheel-spinning

❌ **Premature convergence**: Deciding before exploring alternatives

❌ **Under-estimation**: Starting with totalThoughts too low, constantly adjusting

---

## Requesting This Guide

You can request this guide at any time:

\`\`\`javascript
{
  thoughtNumber: 25,
  totalThoughts: 50,
  thought: "Need to review patterns",
  includeGuide: true,  // Request guide on-demand
  nextThoughtNeeded: true
}
\`\`\`

The guide is also automatically provided:
- At thought 1 (start of reasoning)
- At the final thought (for reflection)

---

## Accessing Thoughtbox

### Direct Tool Access

The standard way to use thoughtbox (when the tool is visible):

\`\`\`javascript
mcp__thoughtbox__thoughtbox({
  thought: "Your reasoning step",
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true
});
\`\`\`

### Via Gateway (Always Available)

If the \`thoughtbox\` tool appears unavailable (common with streaming HTTP clients that don't refresh tool lists), use the gateway:

\`\`\`javascript
mcp__thoughtbox__thoughtbox_gateway({
  operation: 'thought',
  args: {
    thought: "Your reasoning step",
    thoughtNumber: 1,
    totalThoughts: 10,
    nextThoughtNeeded: true
  }
});
\`\`\`

The gateway is always enabled at connection start and routes to the same thought handler internally. All patterns in this cookbook work identically via either access method.

---

## Remember

The tool doesn't tell you **how** to think - it provides **structure for** your thinking. Use it creatively, adapt it to your problem, and don't be constrained by apparent limitations. The flexibility is the power.

**When in doubt:** Trust your reasoning instincts and use the parameters to support your natural thought process.`;
