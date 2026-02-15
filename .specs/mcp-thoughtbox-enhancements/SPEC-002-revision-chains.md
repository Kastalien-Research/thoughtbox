# SPEC-002: Revision Chain Exposure and Visualization

**Status**: Draft
**Priority**: HIGH
**Complexity**: Medium
**Dependencies**: SPEC-001 (optional - can use revision template)

---

## Problem Statement

Revision data exists in the thought graph (`revisesNode` field) but is not easily accessible or visualizable. Agents and users cannot:
- See the evolution of a thought through its revision history
- Understand how concepts refined over time
- Track semantic versioning of ideas

**Evidence from Exploration**:
- S124-S125: Identified revision chain pattern (S1 → S43 → S89 → S98)
- S53: Temporal distance in revisions provides context
- Report Section: "Demonstrated 12 revisions showing progressive refinement"

---

## Requirements

### Functional Requirements

**REQ-001**: Expose revision chain as MCP resource
- **URI**: `thoughtbox://revisions/{sessionId}/{thoughtNumber}` (from SPEC-001)
- **Returns**: Chronologically ordered array of revision thoughts
- **Format**:
  ```json
  {
    "original": { "thoughtNumber": 1, "thought": "S1|H|...", "timestamp": "..." },
    "revisions": [
      { "thoughtNumber": 43, "thought": "S43|R|S1|...", "timestamp": "...", "revisesThought": 1 },
      { "thoughtNumber": 89, "thought": "S89|R|S44|...", "timestamp": "...", "revisesThought": 44 },
      { "thoughtNumber": 98, "thought": "S98|R|S1|...", "timestamp": "...", "revisesThought": 1 }
    ],
    "layers": 3
  }
  ```

**REQ-002**: Calculate revision metadata for each thought
- **New field**: `revisionMetadata` in thought node
- **Contents**:
  - `isOriginal`: boolean (never revised anything)
  - `isRevision`: boolean (revises another thought)
  - `revisesThought`: number | null
  - `revisedBy`: number[] (which thoughts revised THIS one)
  - `revisionDepth`: number (layers deep in revision tree)

**REQ-003**: Export revision tree as graph structure
- **Format**: Mermaid or DOT notation
- **Shows**: Thought evolution with labeled edges
- **Example**:
  ```mermaid
  graph TD
    S1[S1: MCP integration pattern] --> S43[S43: Reflective reasoning system]
    S43 --> S89[S89: Research-grounded architecture]
    S89 --> S98[S98: Meta-cognitive scaffold]
  ```

**REQ-004**: Include revision summary in session export
- **New top-level field**: `revisionAnalysis`
- **Contents**:
  - Total revisions count
  - Most-revised thought (and count)
  - Average temporal distance between revisions
  - Revision density (revisions per 100 thoughts)

### Non-Functional Requirements

**REQ-005**: Revision chain building MUST not impact thought creation performance
- **Strategy**: Build revision metadata asynchronously or on first query
- **Target**: <10ms overhead per thought

**REQ-006**: Revision data MUST persist across server restarts
- **Implementation**: Store in session metadata, not just in-memory

---

## Technical Design

### Data Model Changes

**File**: `src/persistence/types.ts`

```typescript
interface ThoughtNode {
  id: string;
  data: ThoughtData;
  prev: string | null;
  next: string[];
  revisesNode: string | null;  // Existing
  revisionMetadata?: RevisionMetadata;  // NEW
  branchOrigin: string | null;
  branchId: string | null;
}

interface RevisionMetadata {
  isOriginal: boolean;
  isRevision: boolean;
  revisesThought: number | null;
  revisedBy: number[];      // NEW: reverse pointers
  revisionDepth: number;    // NEW: how many layers deep
  revisionChainId: string;  // NEW: group related revisions
}

interface SessionMetadata {
  // ... existing fields
  revisionAnalysis?: {
    totalRevisions: number;
    mostRevisedThought: { thoughtNumber: number; revisionCount: number };
    avgTemporalDistance: number;  // avg thoughts between original and revision
    revisionDensity: number;       // revisions per 100 thoughts
  };
}
```

### Revision Index Builder

**File**: `src/revision/revision-index.ts`

```typescript
export class RevisionIndexBuilder {
  buildIndex(nodes: ThoughtNode[]): Map<number, RevisionMetadata> {
    const index = new Map<number, RevisionMetadata>();

    // First pass: identify revisions
    for (const node of nodes) {
      const isRevision = !!node.revisesNode;
      const metadata: RevisionMetadata = {
        isOriginal: !isRevision,
        isRevision,
        revisesThought: this.extractRevisesThought(node),
        revisedBy: [],
        revisionDepth: 0,
        revisionChainId: this.generateChainId(node)
      };
      index.set(node.data.thoughtNumber, metadata);
    }

    // Second pass: build reverse pointers (revisedBy)
    for (const [thoughtNum, metadata] of index.entries()) {
      if (metadata.revisesThought !== null) {
        const original = index.get(metadata.revisesThought);
        if (original) {
          original.revisedBy.push(thoughtNum);
        }
      }
    }

    // Third pass: calculate revision depth
    for (const [thoughtNum, metadata] of index.entries()) {
      metadata.revisionDepth = this.calculateDepth(thoughtNum, index);
    }

    return index;
  }

  private calculateDepth(thoughtNum: number, index: Map<number, RevisionMetadata>): number {
    const metadata = index.get(thoughtNum);
    if (!metadata || !metadata.revisesThought) return 0;

    const parent = index.get(metadata.revisesThought);
    return 1 + (parent ? this.calculateDepth(metadata.revisesThought, index) : 0);
  }
}
```

---

## Acceptance Criteria

**AC-001**: Revision chain query returns complete history
```typescript
// Given S1 revised by S43, S43 revised by S89
const chain = await readResource("thoughtbox://revisions/SESSION_ID/1");

// Expected
{
  original: { thoughtNumber: 1, ... },
  revisions: [
    { thoughtNumber: 43, revisesThought: 1, ... },
    { thoughtNumber: 89, revisesThought: 43, ... }  // transitively revises S1
  ],
  layers: 2
}
```

**AC-002**: Revision metadata accurately tracks depth
```typescript
// S1 (depth 0) → S43 (depth 1) → S89 (depth 2)
node1.revisionMetadata.revisionDepth === 0
node43.revisionMetadata.revisionDepth === 1
node89.revisionMetadata.revisionDepth === 2
```

**AC-003**: Session export includes revision analysis
```typescript
export.session.revisionAnalysis === {
  totalRevisions: 12,
  mostRevisedThought: { thoughtNumber: 44, revisionCount: 3 },  // S44 → S89 → S135
  avgTemporalDistance: 35.4,  // average thoughts between original and revision
  revisionDensity: 5.0        // 12 revisions / 240 thoughts * 100
}
```

---

## Testing Strategy

### Unit Tests
- Revision index builder with various revision patterns
- Edge cases: circular revisions (should error), orphaned revisions
- Depth calculation for deep chains (S1 → S43 → S89 → S98)

### Integration Tests
- Create session with revisions, query chain, verify order
- Export session, check revision analysis accuracy
- Test revision metadata persistence across server restart

### Regression Tests
- Add to behavioral tests: `tests/thoughtbox/15-revision-chains.md`

---

## Migration Strategy

**Existing Sessions**: Build revision metadata lazily on first query
**New Sessions**: Build revision metadata incrementally as thoughts added

**No Breaking Changes**: Revision metadata is additive, doesn't modify existing structure

---

## Design Decisions

**D1**: Revision chain format - **RESOLVED: Flat List**
- **Decision**: Use flat chronological list [S1, S43, S89, S98]
- **Rationale**:
  - Easier to display and consume
  - Simpler implementation
  - Preserves chronological ordering (primary use case)
  - Tree structure can be added later if needed without breaking API
- **Impact**: `revisions` field returns array, not nested object

**D2**: Handling complex revision patterns - **RESOLVED: Separate Chains**
- **Example**: S43 revises S1, S89 revises S44 (not S43)
- **Decision**: Keep as separate revision chains
- **Rationale**:
  - Each thought can only directly revise one other thought
  - Conceptual relationships handled via cross-references
  - Simpler data model
- **Impact**: Each thought has one revision chain, not a complex graph

---

## References

- Exploration report: S124-S125 (revision versioning), S53 (temporal distance)
- Research: Semantic versioning in ITRS paper
- Current implementation: `src/thought-handler.ts` (isRevision, revisesThought params)

---

**Ready for Implementation**: YES ✅
**Estimated Effort**: 2-3 days
**Confidence Score**: 0.85
