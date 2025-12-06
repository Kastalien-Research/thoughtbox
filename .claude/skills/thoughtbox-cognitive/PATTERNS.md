# Thoughtbox Patterns Cookbook

Quick reference guide for using the thoughtbox tool flexibly. The tool supports multiple reasoning patterns without requiring different code—use the parameters creatively.

## Core Concept

**The tool is a thinking workspace, not a methodology.** Thought numbers are logical positions (like chapter numbers), not chronological order. You can jump, branch, revise, and synthesize freely.

### Basic Parameters
- `thought`: Your reasoning step
- `thoughtNumber`: Logical position (1 to N)
- `totalThoughts`: Estimated total (adjustable)
- `nextThoughtNeeded`: Continue thinking?

### Extension Parameters
- `isRevision`: Updating a previous thought?
- `revisesThought`: Which thought to revise
- `branchFromThought`: Branch starting point
- `branchId`: Branch identifier
- `includeGuide`: Request this guide on-demand

---

## Pattern 1: Forward Thinking (Traditional)

**When to use:** Exploration, discovery, open-ended analysis, brainstorming

**How it works:** Progress sequentially from 1 → 2 → 3 → ... → N

**Example: Analyzing a Performance Issue**
```javascript
// Thought 1
thoughtbox({
  thought: "Identify the problem: Users report checkout is slow, averaging 45 seconds vs target 10 seconds",
  thoughtNumber: 1,
  totalThoughts: 6,
  nextThoughtNeeded: true
})

// Thought 2
thoughtbox({
  thought: "Gather data: Traced request flow - 3 API calls, 2 database queries, no caching",
  thoughtNumber: 2,
  totalThoughts: 6,
  nextThoughtNeeded: true
})

// Thought 3
thoughtbox({
  thought: "Analyze root causes: Database queries average 15s each, API calls 5s total",
  thoughtNumber: 3,
  totalThoughts: 6,
  nextThoughtNeeded: true
})

// Thought 4
thoughtbox({
  thought: "Brainstorm solutions: Redis cache, query optimization, parallel API calls, connection pooling",
  thoughtNumber: 4,
  totalThoughts: 6,
  nextThoughtNeeded: true
})

// Thought 5
thoughtbox({
  thought: "Evaluate: Caching gives biggest impact (80% reduction) for least effort (2 days)",
  thoughtNumber: 5,
  totalThoughts: 6,
  nextThoughtNeeded: true
})

// Thought 6
thoughtbox({
  thought: "Conclusion: Implement Redis cache for product data with 5-min TTL, then optimize queries",
  thoughtNumber: 6,
  totalThoughts: 6,
  nextThoughtNeeded: false
})
```

**Key:** Let each thought build naturally on the previous one.

---

## Pattern 2: Backward Thinking (Goal-Driven)

**When to use:** Planning projects, system design, working from known goals

**How it works:** Start at thought N (desired end), work back to thought 1 (starting point)

**Example: Designing a High-Traffic API**
```javascript
// Start at the end state
thoughtbox({
  thought: "GOAL STATE: API handles 10,000 req/s with <100ms p95 latency, 85%+ cache hit rate",
  thoughtNumber: 8,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

// What must be true before that?
thoughtbox({
  thought: "REQUIRES: Load testing completed, autoscaling verified, runbooks documented",
  thoughtNumber: 7,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

// What comes before that?
thoughtbox({
  thought: "REQUIRES: Monitoring/alerting operational - Datadog dashboards, PagerDuty integration",
  thoughtNumber: 6,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

// Continue working backward...
thoughtbox({
  thought: "REQUIRES: Caching layer implemented - Redis cluster with connection pooling",
  thoughtNumber: 5,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "REQUIRES: Cache invalidation strategy - TTL + event-driven on writes",
  thoughtNumber: 4,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "REQUIRES: Identify what to cache - analyze endpoint usage, read/write ratios",
  thoughtNumber: 3,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "REQUIRES: Baseline metrics - current throughput, latency distribution, query times",
  thoughtNumber: 2,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

// Arrive at starting point
thoughtbox({
  thought: "STARTING POINT: Define success criteria and constraints, get stakeholder sign-off",
  thoughtNumber: 1,
  totalThoughts: 8,
  nextThoughtNeeded: false
})
```

**Key:** For each thought, ask "What must be true immediately before this?"

---

## Pattern 3: Branching (Parallel Exploration)

**When to use:** Comparing alternatives, exploring multiple approaches, A/B scenarios

**How it works:** Create separate branches from a common decision point

**Example: Database Selection Decision**
```javascript
// Build up to decision point
thoughtbox({
  thought: "Context: Building new service needing persistent storage with high read throughput",
  thoughtNumber: 1,
  totalThoughts: 10,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Requirements: 100K reads/sec, 1K writes/sec, complex queries, ACID for transactions",
  thoughtNumber: 2,
  totalThoughts: 10,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Decision point: Need to choose database technology",
  thoughtNumber: 3,
  totalThoughts: 10,
  nextThoughtNeeded: true
})

// Branch A: SQL approach
thoughtbox({
  thought: "BRANCH A - PostgreSQL: ACID compliance, mature tooling, complex queries via SQL, vertical scaling",
  thoughtNumber: 4,
  totalThoughts: 10,
  branchFromThought: 3,
  branchId: "postgres",
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "BRANCH A - Postgres challenges: Scaling at 100K reads, need read replicas, connection pooling",
  thoughtNumber: 5,
  totalThoughts: 10,
  branchFromThought: 3,
  branchId: "postgres",
  nextThoughtNeeded: true
})

// Branch B: NoSQL approach
thoughtbox({
  thought: "BRANCH B - MongoDB: Flexible schema, horizontal scaling, good read performance",
  thoughtNumber: 4,
  totalThoughts: 10,
  branchFromThought: 3,
  branchId: "mongodb",
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "BRANCH B - MongoDB challenges: No ACID transactions, complex queries need aggregation pipeline",
  thoughtNumber: 5,
  totalThoughts: 10,
  branchFromThought: 3,
  branchId: "mongodb",
  nextThoughtNeeded: true
})

// Synthesis
thoughtbox({
  thought: "SYNTHESIS: Use PostgreSQL for transactional data + Redis for read caching. Best of both worlds.",
  thoughtNumber: 6,
  totalThoughts: 10,
  nextThoughtNeeded: false
})
```

**Key:** Explore branches independently, then create a synthesis thought.

---

## Pattern 4: Revision (Updating Previous Thoughts)

**When to use:** Discovered error, gained new information, refined understanding

**How it works:** Mark a thought as revising a previous one

**Example: Updating Based on New Information**
```javascript
// Original analysis
thoughtbox({
  thought: "Stakeholder analysis: Developers, Users, Product Managers - three primary stakeholders",
  thoughtNumber: 4,
  totalThoughts: 15,
  nextThoughtNeeded: true
})

// ... more thoughts ...

// Later, realize something was missed
thoughtbox({
  thought: "REVISION: Critical stakeholder missing - Security team requires compliance reporting, audit logs. This impacts architecture.",
  thoughtNumber: 11,
  totalThoughts: 15,
  isRevision: true,
  revisesThought: 4,
  nextThoughtNeeded: true
})

// Continue with updated understanding
thoughtbox({
  thought: "Updated requirements now include: audit logging, compliance dashboard, data retention policies",
  thoughtNumber: 12,
  totalThoughts: 15,
  nextThoughtNeeded: true
})
```

**Key:** Intellectual honesty > appearing perfect. Revise when you learn.

---

## Pattern 5: Interleaved Thinking (Reason ↔ Action Loops)

**When to use:** Tool-oriented reasoning, adaptive task execution, research tasks

**How it works:** Alternate between reasoning steps (inside thoughtbox) and external tool actions

**Example: Research Task**
```javascript
// Phase 1: Inventory
thoughtbox({
  thought: "INVENTORY: Available tools - Firecrawl (web search), Context7 (docs), file tools, code execution",
  thoughtNumber: 1,
  totalThoughts: 20,
  nextThoughtNeeded: true
})

// Phase 2: Assess
thoughtbox({
  thought: "ASSESS: Tools sufficient for research task - can search web and retrieve documentation",
  thoughtNumber: 2,
  totalThoughts: 20,
  nextThoughtNeeded: true
})

// Phase 3: Strategize
thoughtbox({
  thought: "STRATEGY: 1) Search for current best practices, 2) Retrieve official docs, 3) Synthesize findings",
  thoughtNumber: 3,
  totalThoughts: 20,
  nextThoughtNeeded: true
})

// Phase 4: Execute loop
thoughtbox({
  thought: "EXECUTE: Searching for 'React Server Components best practices 2024'",
  thoughtNumber: 4,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
// [Execute search tool]

thoughtbox({
  thought: "INTEGRATE: Search returned 5 relevant articles. Key themes: streaming, caching, data fetching",
  thoughtNumber: 5,
  totalThoughts: 20,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "EXECUTE: Retrieving official Next.js RSC documentation",
  thoughtNumber: 6,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
// [Execute docs tool]

thoughtbox({
  thought: "INTEGRATE: Docs confirm patterns. Additional insight: use() hook for data loading",
  thoughtNumber: 7,
  totalThoughts: 20,
  nextThoughtNeeded: true
})

// Gate checkpoint
thoughtbox({
  thought: "GATE 1: Sufficient research gathered. Proceeding to synthesis phase.",
  thoughtNumber: 8,
  totalThoughts: 20,
  nextThoughtNeeded: true
})
```

**Key:** Think → Act → Integrate → Act → Integrate. Maintain reasoning continuity.

---

## Pattern 6: First Principles Thinking

**When to use:** Innovation, challenging assumptions, deep understanding

**How it works:** Break down to fundamentals, rebuild from foundation

**Example: Rethinking Authentication**
```javascript
thoughtbox({
  thought: "First Principles: What IS authentication fundamentally? Identity verification + access control",
  thoughtNumber: 1,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Identity verification: Something you KNOW (password), HAVE (token), or ARE (biometric)",
  thoughtNumber: 2,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Access control: Mapping verified identity to permissions. What can this identity do?",
  thoughtNumber: 3,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Current approach: Password = something you know. But shared, phishable, forgettable.",
  thoughtNumber: 4,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "From first principles: Passkeys combine HAVE (device) and ARE (biometric). Eliminates password weaknesses.",
  thoughtNumber: 5,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "Rebuild: Device-bound credentials + biometric verification + WebAuthn standard = better solution",
  thoughtNumber: 6,
  totalThoughts: 8,
  nextThoughtNeeded: false
})
```

---

## Pattern 7: Meta-Reflection

**When to use:** After extended reasoning, to evaluate your thinking process

**How it works:** Step back periodically to assess approach

**Example: Mid-Session Reflection**
```javascript
// After many thoughts...
thoughtbox({
  thought: "META-REFLECTION: At thought 25 of estimated 40. Checking reasoning approach...",
  thoughtNumber: 25,
  totalThoughts: 40,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "META: Progress check - have I addressed the core question? Have I gone on tangents?",
  thoughtNumber: 26,
  totalThoughts: 40,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "META: Bias check - am I favoring familiar solutions? Should I explore more alternatives?",
  thoughtNumber: 27,
  totalThoughts: 40,
  nextThoughtNeeded: true
})

thoughtbox({
  thought: "META: Adjustment - reducing remaining thoughts to 35 total. Main analysis complete, need synthesis.",
  thoughtNumber: 28,
  totalThoughts: 35,  // Adjusted
  nextThoughtNeeded: true
})
```

---

## Combining Patterns

Most complex problems benefit from multiple patterns:

**Example: Architecture Decision**
1. **Forward thinking** (thoughts 1-5): Explore current system
2. **Branching** (thoughts 6-12): Compare 3 architecture options
3. **Backward thinking** (thoughts 13-16): Work back from requirements
4. **First principles** (thoughts 17-20): Break down to fundamentals
5. **Meta-reflection** (thought 21): Assess reasoning quality
6. **Synthesis** (thoughts 22-25): Make final decision

### Adjusting totalThoughts

Start with an estimate, adjust freely:
```javascript
thoughtbox({
  thought: "Original estimate was 20 thoughts. Problem is more complex. Adjusting to 35.",
  thoughtNumber: 15,
  totalThoughts: 35,  // Adjusted upward
  nextThoughtNeeded: true
})
```

---

## Quick Decision Guide

**I need to...**

| Task | Pattern |
|------|---------|
| Explore a new problem | Forward thinking (1→N) |
| Plan a project | Backward thinking (N→1) |
| Compare options | Branching + synthesis |
| Fix an error in reasoning | Revision |
| Challenge assumptions | First principles |
| Coordinate reasoning with actions | Interleaved thinking |
| Assess my reasoning quality | Meta-reflection |
| Design architecture | Backward + branching + synthesis |

---

## Best Practices

### 1. Start with Clear Problem Statement
Your thought 1 should clearly define what you're solving.

### 2. Use Backward Thinking for Goals
If you know the destination, work backward to find the path.

### 3. Branch Early for Alternatives
Don't commit to one approach before exploring alternatives.

### 4. Revise Without Shame
Update earlier thoughts when you learn new information.

### 5. Synthesize Explicitly
Don't just end—create synthesis thoughts that integrate findings.

### 6. Meta-Reflect Periodically
Every 20-30 thoughts, step back and assess your approach.

---

## Common Anti-Patterns

| Anti-Pattern | Why It's Bad | Instead |
|--------------|--------------|---------|
| Sequential rigidity | Missing better paths | Jump around if it makes sense |
| Over-branching | Hard to synthesize | Keep to 4-5 branches max |
| Revision abuse | No forward progress | Revise only with new info |
| Premature convergence | Missing alternatives | Explore before deciding |
| Under-estimation | Constant adjustments | Start with more thoughts |
| No synthesis | Incomplete reasoning | Always end with integration |

---

## Requesting the Guide

Request this guide anytime:
```javascript
thoughtbox({
  thought: "Need to review patterns",
  thoughtNumber: 25,
  totalThoughts: 50,
  includeGuide: true,  // Request guide on-demand
  nextThoughtNeeded: true
})
```

The guide is automatically provided:
- At thought 1 (start of reasoning)
- At the final thought (for reflection)

---

## Remember

The tool doesn't tell you **how** to think—it provides **structure for** your thinking. Use it creatively, adapt it to your problem, and don't be constrained by apparent limitations.

**When in doubt:** Trust your reasoning instincts and use the parameters to support your natural thought process.
