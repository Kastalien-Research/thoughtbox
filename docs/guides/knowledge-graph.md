# Knowledge Graph

## What It Is

The knowledge graph is a persistent store of entities and relations
that accumulates across sessions. Entities represent things learned
during reasoning -- concepts, insights, workflows. Relations connect
them into a navigable graph. The graph survives session completion and
context compaction, making it the primary mechanism for cross-session
memory.

## Entities

Three entity types:

- **Concept** -- a technical idea or abstraction
- **Insight** -- a learned truth validated through reasoning or
  evidence
- **Workflow** -- a process or sequence of steps

Each entity has a name (unique identifier slug), a label (display
name), and optional properties for domain-specific metadata.

Create an entity:

```javascript
async () => {
  return await tb.knowledge.createEntity({
    name: "sliding-window-rate-limiter",
    type: "Concept",
    label: "Sliding Window Rate Limiter",
    properties: {
      domain: "api-design",
      summary:
        "Handles burst traffic better than fixed-window counters"
    }
  });
}
```

The returned object includes the entity's `id` for use in
observations and relations.

## Observations

Timestamped notes attached to entities. Track how understanding
evolves over time -- initial hypothesis, validation results,
production behavior, corrections.

Add an observation:

```javascript
async () => {
  return await tb.knowledge.addObservation({
    entity_id: "entity-uuid-here",
    content:
      "Validated in production: handles 10k req/s with <5ms overhead per check"
  });
}
```

Each observation records when it was added. Query an entity to see its
full observation timeline.

## Relations

Three relation types, all directed edges:

- **BUILDS_ON** -- extends or elaborates on another entity
- **DEPENDS_ON** -- requires another entity to function
- **RELATES_TO** -- connected but neither dependent nor extending

Create a relation:

```javascript
async () => {
  return await tb.knowledge.createRelation({
    from_id: "rate-limiter-uuid",
    to_id: "redis-uuid",
    relation_type: "DEPENDS_ON"
  });
}
```

Direction matters. `A DEPENDS_ON B` means A requires B, not the
reverse.

## Querying

List entities with filters:

```javascript
async () =>
  tb.knowledge.listEntities({
    types: ["Insight"],
    name_pattern: "cache",
    limit: 20
  })
```

Traverse the graph from a starting entity:

```javascript
async () =>
  tb.knowledge.queryGraph({
    start_entity_id: "entity-uuid",
    max_depth: 2,
    relation_types: ["BUILDS_ON", "DEPENDS_ON"]
  })
```

Retrieve a single entity with its observations:

```javascript
async () => tb.knowledge.getEntity("entity-uuid")
```

Get aggregate statistics about the graph:

```javascript
async () => tb.knowledge.stats()
```

## Building Institutional Memory

At the end of a research session, persist findings into the graph so
future sessions start with prior context instead of from scratch.

Worked example -- after researching caching strategies:

```javascript
async () => {
  // Create entities for key findings
  const cacheEntity = await tb.knowledge.createEntity({
    name: "distributed-cache-invalidation",
    type: "Insight",
    label: "Distributed Cache Invalidation",
    properties: {
      domain: "distributed-systems",
      summary: "Event bus invalidation outperforms TTL-based expiry"
    }
  });

  const eventBusEntity = await tb.knowledge.createEntity({
    name: "event-bus-cache-sync",
    type: "Workflow",
    label: "Event Bus Cache Sync",
    properties: {
      domain: "distributed-systems",
      summary: "Publish invalidation events on write, subscribe on read replicas"
    }
  });

  // Add observations with source context
  await tb.knowledge.addObservation({
    entity_id: cacheEntity.id,
    content: "Source: Meta engineering blog 2025-11. TTL-based expiry caused 3-5s stale reads under partition."
  });

  await tb.knowledge.addObservation({
    entity_id: eventBusEntity.id,
    content: "Tested with Redis Streams: p99 invalidation latency 12ms across 3 regions."
  });

  // Connect the findings
  await tb.knowledge.createRelation({
    from_id: eventBusEntity.id,
    to_id: cacheEntity.id,
    relation_type: "BUILDS_ON"
  });

  return { cacheEntity, eventBusEntity };
}
```

Next time an agent researches a related topic, prior work surfaces
immediately:

```javascript
async () =>
  tb.knowledge.listEntities({
    types: ["Insight", "Concept"],
    name_pattern: "cache",
    limit: 10
  })
```

This returns the entities created above, their observations, and
connected relations -- giving the new session a head start instead of
rediscovering the same ground.
