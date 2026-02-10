# Knowledge Graph Extraction - LLM Guide

## Quick Start

```typescript
// 1. Initialize session
thoughtbox_gateway({ operation: "start_new", args: { project: "...", title: "..." } })
thoughtbox_gateway({ operation: "cipher" })

// 2. List sessions to extract from
const sessions = await thoughtbox_gateway({
  operation: "list_sessions",
  args: { filters: { limit: 150 } }
})

// 3. For each session: get structure, read thoughts, extract entities
const structure = await thoughtbox_gateway({
  operation: "get_structure",
  args: { sessionId: "..." }
})

const thoughts = await thoughtbox_gateway({
  operation: "read_thoughts",
  args: { sessionId: "...", range: [1, 30] }
})

// 4. Create entities from extractable thoughts
await thoughtbox_gateway({
  operation: "knowledge",
  args: {
    action: "create_entity",
    name: "kebab-case-specific-name",
    type: "Insight|Workflow|Decision",
    label: "Human-Readable Title",
    properties: { ...typeSpecificProps }
  }
})

// 5. Link entities
await thoughtbox_gateway({
  operation: "knowledge",
  args: {
    action: "create_relation",
    from_id: "uuid-1",
    to_id: "uuid-2",
    relation_type: "BUILDS_ON|DEPENDS_ON|RELATES_TO|CONTRADICTS"
  }
})
```

## Cipher-to-Entity Mapping

Parse thought cipher notation to determine entity type:

```typescript
const cipherRegex = /^S(\d+)\|([A-Z])\|([^|]+)\|(.+)$/s;
const match = thought.thought.match(cipherRegex);
if (match) {
  const [_, thoughtNum, type, deps, content] = match;

  switch (type) {
    case 'C': // Conclusion
      return { entityType: 'Insight', confidence: 0.8 };
    case 'X': // Synthesis
      return { entityType: 'Workflow', confidence: 0.8 };
    case 'D': // Decide
      return { entityType: 'Decision', confidence: 0.7 };
    case 'H': // Hypothesis
      return { entityType: 'Insight', confidence: 0.5 };
    case 'O': // Observe
      return null; // Becomes observation, not entity
    default:
      return null;
  }
}
```

## Entity Type Properties

### Insight
```typescript
{
  type: "Insight",
  properties: {
    key_learning: string,
    confidence: number,  // 0.5-0.95
    evidence_sessions: string[],
    validated_by: string[]
  }
}
```

### Workflow
```typescript
{
  type: "Workflow",
  properties: {
    situation: string,
    actions: string[],
    outcome: "success" | "failure",
    domain: string
  }
}
```

### Decision
```typescript
{
  type: "Decision",
  properties: {
    question: string,
    options: string[],
    chosen: string,
    rationale: string,
    reversible: boolean
  }
}
```

## Parallel Extraction Pattern

For bulk processing, spawn multiple sub-agents:

```typescript
// Divide sessions into batches
const batches = divideSessions(sessions, batchSize: 10-15);

// Spawn agents in parallel
for (const batch of batches) {
  Task({
    subagent_type: "general-purpose",
    model: "haiku", // Cost-efficient
    run_in_background: true,
    prompt: `
      Extract entities from these ${batch.length} sessions:
      ${batch.map(s => `- ${s.id}: ${s.thoughtCount} thoughts`).join('\n')}

      Strategy:
      1. get_structure for each
      2. Skip if <5 thoughts
      3. Read first 5 + last 5 thoughts
      4. Focus on C/X/D cipher types
      5. Create 2-4 entities per session

      Report: "Batch complete: {N} entities from {M} sessions"
    `
  });
}
```

**Expected:** 6-8 agents processing 35 sessions in 5-10 minutes

## Relation Discovery Pattern

After entities exist, create semantic connections:

```typescript
// Divide entities into groups
const entityGroups = divideEntities(entities, groupSize: 12-15);

// Spawn relation-discovery agents
for (const group of entityGroups) {
  Task({
    subagent_type: "general-purpose",
    model: "haiku",
    run_in_background: true,
    prompt: `
      Analyze these ${group.length} entities for semantic relations:
      ${group.map(e => `- ${e.name} (${e.type}): ${e.label}`).join('\n')}

      For each entity:
      1. Identify 2-4 most relevant connections to ANY entity in graph
      2. Classify relation type (BUILDS_ON, DEPENDS_ON, RELATES_TO, CONTRADICTS)
      3. Create via create_relation with reasoning in properties

      Target: ${group.length * 2.5} relations
    `
  });
}
```

**Expected:** 8 agents creating 200-320 relations in 3-5 minutes

## Deduplication

SQLite enforces `UNIQUE(name, type)` constraint. On collision:
- `create_entity` returns existing entity
- Use `add_observation` to add new evidence to existing entity
- Update `evidence_sessions` array (if API supported update_entity)

```typescript
try {
  const entity = await kg.create_entity({ name, type, ... });
  // If duplicate, entity.id will be the existing entity's ID

  // Add new evidence as observation
  await kg.add_observation({
    entity_id: entity.id,
    content: `Also observed in session ${sessionId}: ${evidence}`,
    source_session: sessionId
  });
} catch (e) {
  // Handle actual errors
}
```

## Quality Standards

From calibration phase (Feb 2026):

**Entity naming:**
- Domain-prefixed: `thoughtbox-X`, `hub-X`, `agent-X`
- Specific not generic: `orchestrator-single-coordination-point` not `good-pattern`
- Kebab-case: `word-word-word`
- Unique within type: Check `list_entities` before creating

**Confidence calibration:**
- 0.9-0.95: Multiple sessions, validated, quantified
- 0.8-0.85: Single session, clear conclusion, strong evidence
- 0.7-0.75: Single session, reasonable conclusion
- 0.5-0.6: Hypothesis, weak evidence, needs validation

## Performance Benchmarks

At 99 entities + 321 relations (Feb 2026):
- `knowledge_prime`: <1 second (auto-injects on cipher)
- `list_entities`: <100ms
- `query_graph` (depth=3): <2 seconds
- `create_entity`: <50ms per entity

Performance remains excellent at this scale.

## Validation Checklist

After extraction:

- [ ] Run `knowledge > stats` - Verify entity/relation counts
- [ ] Run `knowledge_prime` - Verify priming digest looks useful
- [ ] Start new session + cipher - Verify auto-injection works
- [ ] Run `query_graph` from a few entities - Verify traversal works
- [ ] Check for orphans - Every entity should have ≥1 relation
- [ ] Test cross-domain paths - Can navigate between domains

## Example: Complete Extraction Run

**Setup:**
```bash
# Check available sessions
Sessions: 123 total
- 40 substantive (≥10 thoughts)
- 43 medium (5-9 thoughts)
- 40 small (<5 thoughts)
```

**Phase 1 - Calibration (manual):**
- Selected 5 diverse sessions (4, 11, 32, 100, 203 thoughts)
- Extracted 17 entities
- Established naming: `domain-specific-concept` pattern
- Confidence: 0.8-0.9 for C/X types

**Phase 2 - Bulk (automated):**
- Spawned 6 sub-agents (Haiku model)
- Processed 35 sessions (732 thoughts)
- Extracted 82 entities
- Duration: 8 minutes parallel execution

**Phase 3 - Linking (automated):**
- Spawned 8 relation-discovery agents
- Analyzed 99 entities for connections
- Created 321 relations
- Duration: 6 minutes parallel execution

**Total time:** ~20 minutes for 99 entities + 321 relations from 40 sessions

## Templates

Complete workflow templates available:
- `docs/plans/2026-02-10-feat-knowledge-graph-session-extraction-plan.md`
- `docs/plans/2026-02-10-feat-knowledge-graph-comprehensive-linking-plan.md`
- `docs/reports/2026-02-10-knowledge-graph-hypothesis-validation.md`
