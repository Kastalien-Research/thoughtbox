# Knowledge Graph Extraction Workflow - Agent Instructions

## Execution Pattern

When user requests knowledge graph extraction from sessions:

### 1. Calibration Phase (5 sessions, manual quality focus)

```typescript
// Select diverse sample
const calibrationSessions = selectDiverse(allSessions, {
  sizes: [4-10, 10-30, 30-70, 70-120, 120+],
  count: 5
});

// Extract with high quality bar
for (const session of calibrationSessions) {
  const structure = await getStructure(session.id);
  const thoughts = await readThoughts(session.id, {
    strategy: "comprehensive" // Read all or most thoughts
  });

  // Classify by cipher type
  const extractable = thoughts.filter(t =>
    t.thought.match(/^S\d+\|[CXD]\|/)
  );

  // Create entities with careful naming
  for (const thought of extractable) {
    await createEntity({
      name: deriveKebabCaseName(thought),
      type: classifyEntityType(thought.cipherType),
      label: extractHumanLabel(thought),
      properties: buildProperties(thought, session)
    });
  }
}

// Document quality standards
const conventions = {
  naming: "domain-specific-concept pattern",
  confidence: "0.8-0.9 for C/X, 0.5-0.6 for H",
  minThoughts: 5  // Skip sessions with <5 thoughts
};
```

### 2. Bulk Extraction Phase (remaining sessions, parallel)

```typescript
// Filter and batch
const substantiveSessions = allSessions.filter(s => s.thoughtCount >= 10);
const batches = divide(substantiveSessions, batchSize: 15);

// Spawn parallel extraction agents
const agents = batches.map((batch, i) =>
  Task({
    description: `Extract batch ${i+1}`,
    subagent_type: "general-purpose",
    model: "haiku",
    run_in_background: true,
    prompt: `
      Extract from ${batch.length} sessions.

      Two-pass strategy:
      1. get_structure for all → skip if <5 thoughts
      2. read_thoughts: first 5 + last 5 + all C/X/D types
      3. Extract 2-4 entities per session (focus on high-confidence)

      Sessions: ${batch.map(s => `${s.id} (${s.thoughtCount}t)`).join(', ')}
      Target: ${batch.length * 2.5} entities

      Report: "Batch ${i+1}: {N} entities from {M} sessions. Names: {list}"
    `
  })
);

// Wait for completion
await Promise.all(agents);
```

### 3. Graph Linking Phase (automated relation discovery)

```typescript
// Load all entities
const entities = await listEntities({ limit: 150 });

// Divide into groups for parallel analysis
const groups = divide(entities, groupSize: 12-15);

// Spawn relation-discovery agents
const linkingAgents = groups.map((group, i) =>
  Task({
    description: `Discover relations ${i+1}`,
    subagent_type: "general-purpose",
    model: "haiku",
    run_in_background: true,
    prompt: `
      Analyze these ${group.length} entities for semantic relations:
      ${group.map(e => `- ${e.name} (${e.type})`).join('\n')}

      For each entity, identify 2-4 connections to ANY entity in graph:
      - BUILDS_ON: B refines/extends A
      - DEPENDS_ON: B requires A
      - RELATES_TO: thematic link
      - CONTRADICTS: tension/conflict

      Create via: create_relation(from_id, to_id, type, {reasoning: "..."})
      Target: ${group.length * 3} relations
    `
  })
);

await Promise.all(linkingAgents);
```

## Cipher Classification Logic

```typescript
function classifyThought(thought: string): EntityClassification | null {
  const match = thought.match(/^S(\d+)\|([A-Z])\|([^|]+)\|(.+)$/s);
  if (!match) return null;

  const [_, num, type, deps, content] = match;

  const classifications: Record<string, EntityClassification> = {
    'C': { type: 'Insight', confidence: 0.8, priority: 'high' },
    'X': { type: 'Workflow', confidence: 0.8, priority: 'high' },
    'D': { type: 'Decision', confidence: 0.7, priority: 'medium' },
    'H': { type: 'Insight', confidence: 0.5, priority: 'low' },
    'P': { type: 'Decision', confidence: 0.6, priority: 'low', condition: 'contains choice' },
    'O': { type: null, priority: 'skip' } // Becomes observation, not entity
  };

  return classifications[type] || null;
}
```

## Entity Property Builders

```typescript
function buildInsightProperties(thought: Thought, session: Session): InsightProps {
  return {
    key_learning: extractKeyLearning(thought.content),
    confidence: calibrateConfidence(thought.type, session),
    evidence_sessions: [session.id],
    validated_by: [],
    domain: inferDomain(thought.content)
  };
}

function buildWorkflowProperties(thought: Thought): WorkflowProps {
  return {
    situation: extractSituation(thought.content),
    actions: extractActions(thought.content),
    outcome: inferOutcome(thought.content), // "success" | "failure"
    domain: inferDomain(thought.content),
    steps: extractSteps(thought.content)
  };
}

function buildDecisionProperties(thought: Thought): DecisionProps {
  return {
    question: extractQuestion(thought.content),
    options: extractOptions(thought.content),
    chosen: extractChosen(thought.content),
    rationale: extractRationale(thought.content),
    decided_by: thought.agentId || "session-analysis",
    reversible: assessReversibility(thought.content)
  };
}
```

## Performance Optimization

**Two-pass reading:**
```typescript
// Pass 1: Structure only (free)
const structure = await get_structure(sessionId);
if (structure.totalThoughts < 5) return; // Skip

// Pass 2: Targeted reading (cost-aware)
const keyThoughts = [
  ...await read_thoughts(sessionId, { range: [1, 5] }),      // Framing
  ...await read_thoughts(sessionId, { last: 5 }),            // Conclusions
  // For large sessions, sample middle sections for C/X/D types
];
```

**Parallel processing:**
```typescript
// Don't process sequentially - use parallel sub-agents
// Bad: for (const session of sessions) { await extract(session); }
// Good: Promise.all(sessions.map(s => extractViaAgent(s)))

const extractionAgents = batches.map(batch =>
  Task({ ...config, run_in_background: true })
);
await waitForAll(extractionAgents); // Parallel execution
```

## Deduplication Strategy

```typescript
async function createOrEnrichEntity(entityData, sessionId) {
  try {
    const result = await kg.create_entity(entityData);

    // If name exists, create_entity returns existing entity
    // Check if this is new or existing
    const isExisting = result.created_at < Date.now() - 1000;

    if (isExisting) {
      // Add observation to existing entity
      await kg.add_observation({
        entity_id: result.id,
        content: `Corroborated in session ${sessionId}: ${evidence}`,
        source_session: sessionId
      });
    }

    return result;
  } catch (e) {
    console.error(`Entity creation failed: ${e.message}`);
    throw e;
  }
}
```

## Relation Type Decision Tree

```
Is B a refinement of A (adds detail/constraint)?
  → BUILDS_ON

Must you understand A before B makes sense?
  → DEPENDS_ON

Do A and B represent conflicting approaches?
  → CONTRADICTS

Are A and B thematically related but neither builds/depends/contradicts?
  → RELATES_TO

Is B extracted from session/entity A?
  → EXTRACTED_FROM
```

## Expected Scale Factors

| Sessions | Entities | Relations | Time (parallel) |
|----------|----------|-----------|-----------------|
| 5 (calib) | 15-20 | 0-10 | 10-15 min |
| 40 (bulk) | 80-100 | 150-250 | 15-20 min |
| 120 (full) | 200-300 | 400-600 | 30-40 min |

## API Limitations & Workarounds

**No update_entity:**
- Workaround: Use `add_observation` for additional evidence
- Cannot update `evidence_sessions` array after creation

**No bidirectional relation query:**
- `query_graph` only follows OUTGOING relations (from_id)
- Cannot easily find entities with high INCOMING degree
- Workaround: Manual traversal or analyze graph.jsonl directly

**No batch operations:**
- Each create_entity/create_relation is separate MCP call
- For 100 entities: 100 calls, ~5 seconds total
- Acceptable performance, but no bulk insert optimization

## Validation Queries

```typescript
// Check for orphans (should be zero)
const orphans = entities.filter(e => {
  const outgoing = await kg.getRelationsFrom(e.id);
  const incoming = await kg.getRelationsTo(e.id);
  return outgoing.length === 0 && incoming.length === 0;
});

// Identify hubs (3-5 expected with ≥10 relations)
const hubs = entities.filter(e => {
  const outgoing = await kg.getRelationsFrom(e.id);
  const incoming = await kg.getRelationsTo(e.id);
  return (outgoing.length + incoming.length) >= 10;
});

// Test cross-domain connectivity
const testingEntity = findByDomain(entities, "testing");
const architectureEntity = findByDomain(entities, "architecture");
const path = await findShortestPath(testingEntity, architectureEntity);
assert(path.length <= 6, "Should reach in <6 hops");
```

## Reference Implementation

See complete working example from Feb 2026 extraction:
- 40 sessions → 99 entities, 321 relations
- 14 parallel agents (6 extraction + 8 linking)
- Total execution: ~25 minutes
- Validation: 5 of 8 hypotheses passed
- Result: Fully connected knowledge graph with priming working

Templates:
- `docs/plans/*-session-extraction-plan.md`
- `docs/plans/*-comprehensive-linking-plan.md`
- `docs/reports/*-hypothesis-validation.md`
