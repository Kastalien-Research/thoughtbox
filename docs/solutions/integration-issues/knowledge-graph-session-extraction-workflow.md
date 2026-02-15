---
title: "Knowledge Graph Session Extraction Workflow"
date: 2026-02-10
category: integration-issues
tags: [knowledge-graph, multi-agent, hub-coordination, session-extraction, mcp]
module: knowledge
symptoms:
  - Knowledge graph empty despite 117 reasoning sessions
  - No priming context available for new sessions
  - Graph.jsonl contains only junk telemetry data
root_cause: Write-only knowledge gap — sessions produced structured reasoning but no extraction pipeline existed to populate the knowledge graph
---

# Knowledge Graph Session Extraction Workflow

## Problem

The Thoughtbox knowledge graph was empty of genuine data. A rogue hook had created 130K+ junk telemetry entities (file-access counters) in the project-local `graph.jsonl`. Meanwhile, 117 real reasoning sessions sat in the Docker container at `/data/thoughtbox/projects/_default/sessions/` with rich, structured thinking — conclusions, syntheses, decisions, hypotheses — all using cipher notation. No pipeline existed to extract knowledge from sessions into the graph.

## Solution: Multi-Agent Hub-Coordinated Extraction

### Architecture

5-phase workflow with Hub coordination and parallel agent extraction:

1. **Cleanup** — Archive junk graph, create empty graph
2. **Hub Setup** — Create workspace, problems with dependencies
3. **Phase 1: Calibration** — Adversarial extraction from 5 sample sessions (Extractor + Critic)
4. **Phase 2: Bulk Extraction** — 3 parallel extractors process ~45 qualifying sessions
5. **Phase 3: Graph Linking** — Linker creates cross-entity relations, Critic reviews topology
6. **Phase 4: Verification** — Stats, priming digest, connectivity checks

### Key Design Decisions

- **Calibration first**: Adversarial review of initial entities established 8 quality rules (R1-R8) before bulk processing
- **Two-pass strategy**: `get_structure` to filter sessions, then targeted reading of first 3 + last 5 + C/X/D cipher thoughts
- **R4 (project-specificity filter)**: Skip sessions about CSS colors, revenue strategy, font debugging — only extract generalizable insights
- **Parallel extraction**: 3 agents processing batches concurrently (mega, large, medium/small sessions)
- **UNIQUE(name, type) dedup**: SQLite constraint handles exact duplicates; `add_observation` for corroborating evidence

### Entity Classification Rules

| Cipher Type | Entity Type | Priority |
|-------------|-------------|----------|
| C (Conclusion) | Insight | High |
| X (Synthesis) | Workflow | High |
| D (Decide) | Decision | If captures choice + rationale |
| H (Hypothesis) | Insight | Low confidence (0.5-0.7) |
| P (Plan) | Decision | Only if captures a choice |
| O (Observe) | Not an entity | Becomes observations on related entities |

### Calibration Rules (R1-R8)

- **R1**: H-sourced entities capped at confidence 0.6-0.7
- **R2**: One entity per core insight (merge corroborating sessions)
- **R3**: Labels must be self-contained sentences
- **R4**: Skip project-specific content (CSS, revenue, commit strategy)
- **R5**: Kebab-case naming, descriptive, unique
- **R6**: Standard techniques only if novel application demonstrated
- **R7**: Problem-solution pairings connected via RELATES_TO
- **R8**: Type distribution follows guide (Insight for findings, Concept for frameworks, Decision for choices, Workflow for processes)

## Results

| Metric | Value |
|--------|-------|
| Entities | 57 (24 Concept, 25 Insight, 4 Workflow, 4 Decision) |
| Relations | 75 (38 BUILDS_ON, 1 CONTRADICTS, 4 DEPENDS_ON, 32 RELATES_TO) |
| Observations | 18 |
| Sessions processed | 30 qualifying out of ~45 candidates |
| Sessions skipped | ~87 (test data, project-specific, <5 thoughts, empty) |
| Agents spawned | 7 (2 calibration + 3 extractors + 1 linker + 1 critic) |

### Critic Assessment: 3/5 Stars

- Entity naming: 4.5/5 (excellent kebab-case, descriptive labels)
- Type accuracy: 4/5 (1 borderline misclassification)
- Relation quality: 3/5 (3 duplicate relations, meaningful types)
- Connectivity: 2.5/5 (3 remaining orphans post-linking)
- Observation depth: 1.5/5 (0.32 avg, most entities bare)

## Prevention / Future Improvements

1. **Auto-extraction hook**: Add post-session hook that proposes entities from C/X/D thoughts
2. **Observation enrichment**: Bulk-add supporting evidence to existing entities
3. **Dedup cleanup**: Remove 3 duplicate relations found by Critic
4. **Continuous calibration**: Re-run Critic periodically as graph grows
5. **Entity count target**: Graph should grow to 200+ entities as more sessions accumulate

## API Parameter Reference

Correct parameter names (discovered through errors):

```
# add_observation
entity_id (not entityId), content (not observation)

# create_relation
from_id (not source_id), to_id (not target_id)

# query_graph
start_entity_id (not entity_id)
```

## Hub Coordination Lessons

- Re-registering on Hub gives new agentId, losing coordinator role
- Sub-agents re-registering displaces parent's Hub session
- `query_graph` only follows outgoing relations — foundational entities appear as 0 connections when queried directly
- Spawn all agents as `subagent_type: "general-purpose"` for ToolSearch access
