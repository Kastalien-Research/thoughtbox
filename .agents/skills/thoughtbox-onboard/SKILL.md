---
name: thoughtbox:onboard
description: Gateway orientation for agents using Thoughtbox MCP for the first time. Use this skill when you connect to a Thoughtbox MCP server and need to understand what's available, how to structure reasoning sessions, or how to use the tb SDK. Also use when you're unsure which Thoughtbox operation to use for a task, or when you want to check what modules and patterns are available. Triggers on first Thoughtbox interaction, "how do I use Thoughtbox", "what can Thoughtbox do", or any confusion about Thoughtbox operations.
user-invocable: true
argument-hint: [optional: specific area to learn about, e.g. "branching" or "knowledge graph"]
---

# Thoughtbox Onboarding

Thoughtbox is an MCP server that gives you a structured reasoning workspace. It persists your thinking across sessions, lets you branch and revise ideas, and builds a knowledge graph from your insights. This guide gets you productive in 5 minutes.

## What You Have

Seven modules, two tools:

| Module | What it does | Access via |
|--------|-------------|------------|
| **thought** | Record structured reasoning steps with types, branching, revision | `tb.thought()` |
| **session** | List, search, resume, export, analyze reasoning sessions | `tb.session.*` |
| **knowledge** | Entity graph with observations, relations, traversal | `tb.knowledge.*` |
| **notebook** | Literate programming — create cells, execute code, export | `tb.notebook.*` |
| **theseus** | Friction-gated refactoring protocol (scope locking, visa system) | `tb.theseus()` |
| **ulysses** | Surprise-gated debugging protocol (S-register, forced reflection) | `tb.ulysses()` |
| **observability** | Health checks, session monitoring, cost tracking | `tb.observability()` |

**Two MCP tools** give you access to everything:
- `thoughtbox_search` — query the operation catalog (what's available, schemas, examples)
- `thoughtbox_execute` — run JavaScript using the `tb` SDK to chain operations

## Quick Start: Your First Session

### 1. Record a thought

```javascript
// thoughtbox_execute
async () => {
  return await tb.thought({
    thought: "Analyzing the authentication flow for security gaps",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 10,
    sessionTitle: "Auth Security Review",
    sessionTags: ["security", "auth"]
  });
}
```

The first thought creates a session automatically. Subsequent thoughts append to it.

### 2. Branch to explore alternatives

```javascript
async () => {
  // Branch from thought 3 to explore two options
  await tb.thought({
    thought: "Option A: Token rotation with short-lived JWTs",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 4,
    totalThoughts: 10,
    branchFromThought: 3,
    branchId: "jwt-rotation"
  });
}
```

### 3. Revise when you learn something new

```javascript
async () => {
  await tb.thought({
    thought: "REVISED: JWT rotation won't work — the session store doesn't support atomic swap",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 8,
    totalThoughts: 10,
    isRevision: true,
    revisesThought: 4
  });
}
```

### 4. Complete the session

Always complete your sessions — don't leave them dangling:

```javascript
async () => {
  await tb.thought({
    thought: "Conclusion: Use opaque reference tokens with server-side validation. JWTs are a poor fit for this session model.",
    thoughtType: "reasoning",
    nextThoughtNeeded: false,  // This ends the session
    thoughtNumber: 10,
    totalThoughts: 10
  });
}
```

## Thought Types

Each thought has a semantic type. The type determines what metadata fields are required:

| Type | When to use | Required extra fields |
|------|------------|----------------------|
| `reasoning` | Default — analysis, exploration, brainstorming | None |
| `decision_frame` | Choosing between options | `confidence`, `options` (exactly 1 selected) |
| `action_report` | Recording what you did | `actionResult` (success, reversible, tool, target) |
| `belief_snapshot` | Capturing current understanding | `beliefs` (entities array, optional constraints/risks) |
| `assumption_update` | Tracking assumption changes | `assumptionChange` (text, oldStatus, newStatus) |
| `context_snapshot` | Recording environment state | `contextData` (toolsAvailable, constraints, etc.) |
| `progress` | Tracking task status | `progressData` (task, status, note) |

**Example — decision frame:**
```javascript
async () => {
  await tb.thought({
    thought: "Choosing between Redis and Memcached for session cache",
    thoughtType: "decision_frame",
    confidence: "high",
    options: [
      { label: "Redis", selected: true, reason: "Persistence, data structures, pub/sub" },
      { label: "Memcached", selected: false, reason: "Simpler but no persistence" }
    ],
    nextThoughtNeeded: true,
    thoughtNumber: 5,
    totalThoughts: 10
  });
}
```

Note: `decision_frame` requires **exactly one** option with `selected: true`.

## Core Patterns

### Forward Thinking (1 to N)
Best for exploration. Start at thought 1, build incrementally.

### Backward Thinking (N to 1)
Best for planning. Start at the goal (thought N), work back to the starting point.

### Branching
Best for comparing alternatives. Branch from a common thought, explore independently, then synthesize.

### Revision
Best for honest course correction. Mark thoughts as revisions when you learn new information.

### Interleaved Thinking
Best for tool-heavy tasks. Alternate between Thoughtbox reasoning and external tool calls. Think, act, reflect, act.

Read `thoughtbox://patterns-cookbook` for detailed examples of each pattern.

## Session Management

```javascript
// List recent sessions
async () => tb.session.list({ limit: 5 })

// Search by keyword
async () => tb.session.search("authentication")

// Resume a previous session (continue adding thoughts to it)
async () => tb.session.resume("session-uuid-here")

// Export as markdown
async () => tb.session.export("session-uuid-here", "markdown")

// Analyze structure (linearity, revision rate, convergence)
async () => tb.session.analyze("session-uuid-here")
```

### Session Hygiene

- **Title meaningfully** — "Auth Security Review" not "Session 1"
- **Tag for searchability** — `["security", "auth", "review"]`
- **Always complete sessions** — set `nextThoughtNeeded: false` on your last thought
- **Resume, don't duplicate** — if returning to a topic, `tb.session.resume(id)` instead of starting fresh
- **Export valuable sessions** before they scroll out of view

## Knowledge Graph

The knowledge graph persists insights across sessions. Use it to build institutional memory.

```javascript
// Create an entity
async () => tb.knowledge.createEntity({
  name: "sliding-window-rate-limiter",
  type: "Concept",
  label: "Sliding Window Rate Limiter",
  properties: { domain: "api-design", summary: "Handles burst traffic better than fixed buckets" }
})

// Add an observation (timestamped note)
async () => tb.knowledge.addObservation({
  entity_id: "entity-uuid",
  content: "Validated in production: handles 10k req/s with <5ms overhead"
})

// Create a relation
async () => tb.knowledge.createRelation({
  from_id: "rate-limiter-uuid",
  to_id: "redis-uuid",
  relation_type: "DEPENDS_ON"
})

// Traverse the graph
async () => tb.knowledge.queryGraph({
  start_entity_id: "some-uuid",
  max_depth: 2,
  relation_types: ["BUILDS_ON", "DEPENDS_ON"]
})

// Get stats
async () => tb.knowledge.stats()
```

**Entity types**: `Concept`, `Insight`, `Workflow`
**Relation types**: `BUILDS_ON`, `DEPENDS_ON`, `RELATES_TO`

## Cipher Notation (Long Sessions)

For sessions over ~20 thoughts, switch to cipher notation to save context tokens (2-4x compression):

```
S5|H|—|API latency ↑ bc db query regression
S6|E|S5|query metrics: p99 ↑3x on user lookup ⊕ [H1]
S7|C|S5-S6|[H1] conf (!), investigate query Δ in deploy
```

Format: `[ID]|[TYPE]|[REFS]|[CONTENT]`

Types: `H`=hypothesis, `E`=evidence, `C`=conclusion, `Q`=question, `R`=revision, `P`=plan, `O`=observation, `A`=assumption, `X`=rejected

Read `thoughtbox://cipher` for the full notation reference.

## Discovering Operations

Use `thoughtbox_search` to explore what's available:

```javascript
// List all modules
async () => Object.keys(catalog.operations)

// See operations in a module
async () => catalog.operations.session

// Search by keyword
async () => {
  const q = "export";
  return Object.entries(catalog.operations).flatMap(([mod, ops]) =>
    Object.entries(ops)
      .filter(([_, op]) => op.description.toLowerCase().includes(q))
      .map(([name, op]) => ({ module: mod, name, title: op.title }))
  );
}

// List available prompts
async () => catalog.prompts

// List available resources
async () => catalog.resources.map(r => ({ name: r.name, uri: r.uri }))
```

## Gotchas

- `decision_frame` requires `confidence` AND `options` with exactly 1 selected
- `context_snapshot` requires `contextData` object
- Notebook code cells require a `filename` field
- `tb.theseus()` and `tb.ulysses()` take `{operation, ...args}` (flat), not nested under `args`
- `tb.session`, `tb.knowledge`, `tb.notebook` are objects with methods; `tb.thought`, `tb.theseus`, `tb.ulysses`, `tb.observability` are functions
- Thought numbers must be unique per session+branch — can't reuse a number

## What's Next

Once oriented, reach for these skills as needed:

| Task | Skill |
|------|-------|
| Research a topic with structured reasoning | `thoughtbox:research` |
| Make a decision between options | `thoughtbox:decision` |
| Debug something unexpected | `thoughtbox:debug` |
| Refactor with scope discipline | `thoughtbox:refactor` |
| Review what a session produced | `thoughtbox:session-review` |
| Query past knowledge | `thoughtbox:knowledge-query` |
