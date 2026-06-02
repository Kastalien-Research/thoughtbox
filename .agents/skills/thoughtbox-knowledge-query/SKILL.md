---
name: thoughtbox:knowledge-query
description: Cross-session knowledge retrieval from the Thoughtbox knowledge graph. Searches entities, traverses relations, retrieves observations, and synthesizes findings from past sessions. Use when you need to recall prior decisions, check what's already known about a topic, find related insights, or build on past work. Triggers on "what do we know about", "have we seen this before", "recall", "prior decisions about", "knowledge graph", or when starting work that might have prior context.
user-invocable: true
argument-hint: [topic or question to search for]
---

# Thoughtbox Knowledge Query

The knowledge graph accumulates insights across sessions. This skill retrieves and synthesizes that accumulated knowledge so you don't rediscover what's already known.

## Workflow

### Phase 1: Search

Cast a wide net across both sessions and the knowledge graph:

```javascript
// Search sessions by keyword
async () => {
  const sessions = await tb.session.search("authentication", 10);
  return sessions;
}
```

```javascript
// Search entities by name pattern and type
async () => {
  const entities = await tb.knowledge.listEntities({
    name_pattern: "auth",
    types: ["Concept", "Insight"],
    limit: 20
  });
  return entities;
}
```

```javascript
// Get graph statistics for context
async () => tb.knowledge.stats()
```

### Phase 2: Traverse

For relevant entities, explore their neighborhood in the graph:

```javascript
async () => {
  return await tb.knowledge.queryGraph({
    start_entity_id: "entity-uuid-here",
    max_depth: 2,
    relation_types: ["BUILDS_ON", "DEPENDS_ON", "RELATES_TO"]
  });
}
// Returns: connected entities and relations within 2 hops
```

Check observations for temporal context:

```javascript
async () => {
  return await tb.knowledge.getEntity("entity-uuid-here");
  // Includes observations array with timestamps and content
}
```

### Phase 3: Retrieve Session Context (If Needed)

For deep dives, retrieve the full session that produced an insight. Use the subagent-summarize pattern to avoid context pollution:

```
Spawn a subagent with:
  "Retrieve and summarize Thoughtbox session [ID].
   Call: async () => tb.session.get('[ID]')
   Extract only information about [TOPIC].
   Return a 3-5 sentence summary. No raw thoughts."
```

This keeps the full session (~800 tokens) in the subagent's context and returns only ~80 tokens to yours. 10x context reduction.

### Phase 4: Synthesize

Combine findings from entities, relations, observations, and sessions into a coherent answer:

```
## Knowledge Query: "[topic]"

### Entities Found
- [Concept] "entity-name" — summary from properties
  - Observation (date): "..."
  - Related to: entity-B (BUILDS_ON), entity-C (DEPENDS_ON)

### Session Context
- Session "title" (date, N thoughts): [summary from subagent]

### Gaps
- No entities found for [sub-topic] — consider creating one
- Session from [date] may be outdated — verify current state
```

### Phase 5: Bridge New Knowledge (Optional)

If this query reveals connections not yet in the graph, create them:

```javascript
async () => {
  // New relation discovered during query
  await tb.knowledge.createRelation({
    from_id: "entity-a-uuid",
    to_id: "entity-b-uuid",
    relation_type: "RELATES_TO",
    properties: { discovered_via: "knowledge-query", context: "both relate to session management" }
  });
}
```

## Entity Types and Relations

**Types**: `Concept` (technical idea), `Insight` (learned truth), `Workflow` (process)

**Relations**: `BUILDS_ON` (extends), `DEPENDS_ON` (requires), `RELATES_TO` (connected)

## Tips

- Search broadly first, then narrow — entity names may not match your exact wording
- Check observation timestamps — old observations may be stale
- Use `types` filter when you know you're looking for a decision (Insight) vs a concept (Concept)
- If nothing is found, the gap itself is useful information — consider recording it
