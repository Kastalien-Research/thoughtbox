---
name: thoughtbox:session-review
description: Analyze completed Thoughtbox sessions to extract patterns, anti-patterns, and learnings for the knowledge graph. This is the learning loop that makes Thoughtbox improve over time. Use after completing a reasoning session, when reviewing past sessions for insights, or when you want to assess reasoning quality. Triggers on "review session", "what did I learn", "extract insights", "analyze reasoning", "session retrospective", or proactively after any significant session completes.
user-invocable: true
argument-hint: [session ID, or "latest" to review most recent]
---

# Thoughtbox Session Review

Sessions are write-once without review. This skill turns completed sessions into reusable knowledge by identifying what worked, what didn't, and what to carry forward.

## Workflow

### Phase 1: Retrieve and Measure

Find the session and get structural metrics:

```javascript
// thoughtbox_execute — find the session
async () => {
  // By ID:
  const session = await tb.session.get("session-uuid");
  // Or find latest:
  const list = await tb.session.list({ limit: 1 });
  return list;
}
```

```javascript
// Get structural metrics
async () => {
  const analysis = await tb.session.analyze("session-uuid");
  return analysis;
  // Returns: linearityScore, revisionRate, maxDepth, thoughtDensity,
  //          critiqueRequests, hasConvergence, isComplete
}
```

**Interpret the metrics:**

| Metric | High value means | Look for |
|--------|-----------------|----------|
| `revisionRate` > 0.15 | Many course corrections | Anti-patterns — what kept going wrong? |
| `linearityScore` < 0.7 | Heavy branching | Exploration strategies — were branches productive? |
| `hasConvergence` = true | Branches resolved | Decision patterns — how was the choice made? |
| `isComplete` = false | Session abandoned | Why? Context loss? Stuck? Deprioritized? |

### Phase 2: Identify Key Moments

Retrieve the full session and scan for signal thoughts:

```javascript
async () => {
  const session = await tb.session.get("session-uuid");
  return session.thoughts;
}
```

Scan for these moment types:

- **Pivots** — reasoning direction changed. Look for: "actually", "wait", "on second thought", significant topic shift
- **Decisions** — uncertainty resolved. Look for: "choosing", "decided", "going with", comparison conclusions
- **Insights** — synthesis occurred. Look for: "this means", "the pattern is", "I see now", connections between ideas
- **Revisions** — corrections made. Check `isRevision: true` field
- **Branch points** — exploration diverged. Check `branchFromThought` field

Rate each moment:
- **Impact** (1-10): How much did this thought influence the outcome?
- **Novelty** (1-10): Was this a new approach or standard reasoning?
- **Transferability** (1-10): Could this pattern apply to other problems?

### Phase 3: Extract Learnings

Feed identified moments to the extraction system:

```javascript
async () => {
  return await tb.session.extractLearnings("session-uuid",
    [
      {
        thoughtNumber: 5,
        type: "decision",
        significance: 8,
        summary: "Chose hybrid caching approach over pure Redis"
      },
      {
        thoughtNumber: 12,
        type: "insight",
        significance: 9,
        summary: "Cache invalidation can piggyback on existing event bus"
      },
      {
        thoughtNumber: 8,
        type: "pivot",
        significance: 6,
        summary: "Abandoned single-cache approach after discovering TTL limitations"
      }
    ],
    ["pattern", "anti-pattern", "signal"]
  );
}
```

### Phase 4: Persist to Knowledge Graph

For each extracted learning, create a durable knowledge entity:

```javascript
async () => {
  // Pattern becomes an Insight entity
  const entity = await tb.knowledge.createEntity({
    name: "event-bus-cache-invalidation",
    type: "Insight",
    label: "Cache invalidation via existing event bus",
    properties: {
      domain: "caching",
      source_session: "session-uuid",
      summary: "Rather than building a separate invalidation mechanism, piggyback on the existing event bus"
    }
  });

  // Connect to related concepts
  await tb.knowledge.createRelation({
    from_id: entity.id,
    to_id: "existing-event-bus-entity-id",
    relation_type: "BUILDS_ON"
  });
}
```

For anti-patterns, add observations explaining what went wrong:

```javascript
async () => {
  const entity = await tb.knowledge.createEntity({
    name: "single-cache-ttl-limitation",
    type: "Insight",
    label: "Single-cache approach fails with heterogeneous TTLs",
    properties: { domain: "caching", type: "anti-pattern" }
  });

  await tb.knowledge.addObservation({
    entity_id: entity.id,
    content: "Discovered in session XYZ: a single Redis instance can't efficiently handle objects with vastly different TTL requirements. The eviction policy conflicts."
  });
}
```

### Phase 5: Report

Present a summary to the user:

```markdown
## Session Review: [title]

### Metrics
- Thoughts: N | Branches: N | Revisions: N
- Linearity: X | Revision rate: X%
- Convergence: yes/no | Complete: yes/no

### Key Moments
1. [Thought N] **Decision**: Chose hybrid caching (impact: 8)
2. [Thought M] **Insight**: Event bus for invalidation (impact: 9)
3. [Thought K] **Pivot**: Abandoned single-cache (impact: 6)

### Patterns Extracted
- Event bus cache invalidation (persisted as knowledge entity)

### Anti-Patterns Identified
- Single-cache with heterogeneous TTLs (persisted with observation)

### Knowledge Graph Updates
- Created N entities, M relations, K observations
```

## When to Review

- After any session >15 thoughts
- After sessions that involved significant decisions
- After sessions with high revision rates (something kept going wrong)
- Periodically, to maintain the learning loop

See `thoughtbox://session-analysis-guide` for the full qualitative analysis process.
