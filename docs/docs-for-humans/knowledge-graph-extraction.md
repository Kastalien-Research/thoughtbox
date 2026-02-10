# Knowledge Graph: Extracting Insights from Reasoning Sessions

## Overview

The Thoughtbox knowledge graph enables persistent memory by extracting insights, workflows, and decisions from your reasoning sessions. This guide shows how to populate your knowledge graph from archived sessions.

## What Gets Extracted

The extraction process identifies extractable knowledge by analyzing thought cipher types:

| Cipher Type | Extracts As | Priority | Confidence |
|-------------|-------------|----------|------------|
| **C** (Conclusion) | Insight entity | High | 0.8-0.9 |
| **X** (Synthesis) | Workflow entity | High | 0.8-0.9 |
| **D** (Decide) | Decision entity | Medium | 0.7-0.8 |
| **H** (Hypothesis) | Insight entity | Low | 0.5-0.6 |
| **P** (Plan) | Decision entity (if choice made) | Low | 0.6-0.7 |
| **O** (Observe) | Observations on other entities | N/A | N/A |

## Extraction Workflow

### Phase 1: Calibration (3-5 sessions)

Select diverse sample sessions to establish quality standards:

1. **Session selection** - Pick 3-5 sessions varying in size (10-200 thoughts) and topic
2. **Manual extraction** - Read sessions, classify thoughts, create entities carefully
3. **Quality review** - Verify naming conventions, confidence calibration, type accuracy
4. **Document standards** - Capture entity naming patterns and extraction criteria

**Expected output:** 15-25 high-quality entities, established naming conventions

### Phase 2: Bulk Extraction (remaining sessions)

Use parallel processing for efficiency:

1. **Two-pass strategy:**
   - Pass 1: Run `get_structure` on all sessions, filter out <5 thought sessions
   - Pass 2: Read first 5 + last 5 thoughts + all C/X/D types

2. **Parallel agents:** Spawn 6-8 sub-agents, each processing 10-15 sessions
3. **Direct creation:** Agents create entities via `knowledge > create_entity` (bypass proposals for speed)
4. **Quality gates:** Spot-check every 2-3 batches

**Expected output:** 60-100 additional entities from substantive sessions

### Phase 3: Graph Linking

Create semantic connections between entities:

1. **Automated discovery:** Spawn 8 relation-discovery agents analyzing entity pairs
2. **Relation types:**
   - BUILDS_ON: Entity B refines/extends A
   - DEPENDS_ON: B requires understanding A
   - CONTRADICTS: B conflicts with A
   - RELATES_TO: Thematic connection

3. **Target:** 150-250 relations (1.5-2.5 per entity average)

**Expected output:** Fully connected knowledge graph

## Entity Naming Conventions

Use kebab-case, domain-prefixed, specific names:

**Good examples:**
- `thoughtbox-as-cognitive-prosthesis` (not `thoughtbox-tool`)
- `structural-vs-functional-verification-bias` (not `verification-problem`)
- `mcp-tool-inheritance-duplicate-bug` (not `mcp-bug-1`)

**Pattern:** `domain-specific-concept-or-pattern`

## Validation Hypotheses

After extraction and linking, validate these properties:

1. **Priming Quality:** Knowledge digest auto-injects on cipher load
2. **Cross-Domain Discovery:** Can traverse from any domain to any other in <6 hops
3. **Contradictions:** 5-10 CONTRADICTS relations capturing design tensions
4. **Hub Entities:** 3-5 highly-connected entities (≥10 relations)
5. **Performance:** All queries <2 seconds at 100 entities + 300 relations

## Expected Scale

**From 117 sessions:**
- 40 substantive sessions (≥10 thoughts) → 80-120 entities
- 40 medium sessions (5-9 thoughts) → 20-40 entities
- 37 small sessions (<5 thoughts) → 5-10 entities
- **Total:** 105-170 entities, 180-340 relations

**From this project (Feb 2026 extraction):**
- 40 sessions processed → 99 entities, 321 relations
- Matches expected ranges ✓

## Tools & Commands

**Reading sessions:**
```typescript
// List available sessions
thoughtbox_gateway({ operation: "list_sessions", args: { filters: { limit: 150 } } })

// Get session structure (fast)
thoughtbox_gateway({ operation: "get_structure", args: { sessionId: "..." } })

// Read thoughts
thoughtbox_gateway({ operation: "read_thoughts", args: { sessionId: "...", range: [1, 30] } })
```

**Creating entities:**
```typescript
thoughtbox_gateway({
  operation: "knowledge",
  args: {
    action: "create_entity",
    name: "kebab-case-name",
    type: "Insight|Workflow|Decision|Concept",
    label: "Human-Readable Title",
    properties: {
      key_learning: "...", // For Insights
      confidence: 0.85,
      evidence_sessions: ["session-uuid"]
    }
  }
})
```

**Creating relations:**
```typescript
thoughtbox_gateway({
  operation: "knowledge",
  args: {
    action: "create_relation",
    from_id: "entity-uuid-1",
    to_id: "entity-uuid-2",
    relation_type: "BUILDS_ON|DEPENDS_ON|RELATES_TO|CONTRADICTS",
    properties: { reasoning: "why this connection exists" }
  }
})
```

## Performance Tips

1. **Use Haiku for extraction agents** - Cost-efficient for bulk processing
2. **Batch sessions** - Process 10-15 at a time to manage context
3. **Two-pass strategy** - Structure scan first saves reading unnecessary thoughts
4. **Parallel agents** - 6-8 agents can process 40 sessions in 5-10 minutes
5. **Focus on C/X types** - Most extractable knowledge is in conclusions and syntheses

## Common Pitfalls

❌ **Creating duplicate entities** - Check `list_entities` with name_pattern before creating
❌ **Generic names** - "pattern-1" vs "orchestrator-worker-parallel-pattern"
❌ **Wrong entity types** - Ensure Insights vs Workflows vs Decisions are correctly classified
❌ **Missing confidence** - Always include confidence score with evidence justification
❌ **Forgetting source sessions** - Track evidence_sessions for provenance

## See Also

- [Knowledge Graph Spec](../dgm-specs/SPEC-KNOWLEDGE-MEMORY.md) - Full specification
- [Extraction Plan Template](../plans/2026-02-10-feat-knowledge-graph-session-extraction-plan.md)
- [Linking Plan Template](../plans/2026-02-10-feat-knowledge-graph-comprehensive-linking-plan.md)
- [Hypothesis Validation Report](../reports/2026-02-10-knowledge-graph-hypothesis-validation.md)
