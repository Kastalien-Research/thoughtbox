# SPEC-003: Cross-Session Reference System

**Status**: Draft
**Priority**: HIGH
**Complexity**: High
**Dependencies**: SPEC-001 (resource templates for search), SPEC-002 (revision chains may span sessions)

---

## Problem Statement

Currently, thoughts can only reference other thoughts within the same session. Cross-session learning requires:
- Viewing prior session exports manually
- Copying insights into new sessions
- No formal linkage between related reasoning chains

This limits institutional knowledge accumulation (5-year horizon identified in S229).

**Evidence from Exploration**:
- S140: Session list showed prior work (70, 116, 92, 99 thought sessions)
- S229: "5-year horizon: hundreds of sessions → queryable reasoning corpus"
- S163: Cross-session learning demonstrated (building on prior session patterns)

---

## Requirements

### Functional Requirements

**REQ-001**: Support semantic anchor syntax in thought text
- **Syntax**: `@keyword:SN` or `@keyword:SN-SN`
- **Examples**:
  - `@agent-phenomenology:S25`
  - `@revision-patterns:S89-S94`
- **Behavior**: Anchor stored as-is during writing (no resolution required)

**REQ-002**: Resolve anchors at query/export time
- **Trigger**: When session is exported or anchor-resolution resource is queried
- **Process**:
  1. Parse thought text for `@keyword:SN` patterns
  2. Search sessions by tag, title, content for keyword
  3. Return top matches with metadata
  4. Cache resolutions to avoid repeated searches

**REQ-003**: Search strategy for anchor resolution
- **Priority order**:
  1. Exact tag match (highest confidence)
  2. Title fuzzy match (medium confidence)
  3. Content keyword search (lower confidence)
  4. Temporal proximity (recent sessions ranked higher)
- **Returns**: Array of candidates with confidence scores

**REQ-004**: Handle ambiguous anchors interactively
- **If multiple matches** with similar confidence:
  - Return all candidates
  - Include: sessionId, title, thoughtCount, createdAt, matchReason
  - Let application/user choose

**REQ-005**: Handle broken references gracefully
- **If no matches found**:
  - Mark as `[unresolved: @keyword]` in export
  - Include anchor text so context is preserved
  - Log for debugging

**REQ-006**: Optional alias system for curated sessions
- **Config location**: Project-level `.thoughtbox/aliases.json`
- **Format**:
  ```json
  {
    "phenomenology-2026-01": "a3d80d32-dc3a-4008-a5c9-789c49350ef0",
    "revision-patterns": "6f910d57-7e28-4d23-baf7-f09f0a7b9792"
  }
  ```
- **Usage**: `@phenomenology-2026-01:S25` resolves directly to session

### Non-Functional Requirements

**REQ-007**: Anchor resolution MUST be fast (<500ms)
- **Strategy**: Build search index over session titles/tags
- **Acceptable**: Slower first query, cached thereafter

**REQ-008**: Broken references MUST NOT prevent export
- **Graceful degradation**: Export succeeds with unresolved markers

**REQ-009**: Circular reference detection
- **Scenario**: Session A refs Session B refs Session A
- **Behavior**: Detect cycle, warn, allow but don't infinite loop

---

## Technical Design

### Anchor Parser

**New File**: `src/references/anchor-parser.ts`

```typescript
export interface Anchor {
  raw: string;                // "@keyword:S25"
  keyword: string;            // "keyword"
  thoughtRef: string;         // "S25" or "S25-S30"
  thoughtNumbers: number[];   // [25] or [25,26,27,28,29,30]
}

export class AnchorParser {
  private anchorPattern = /@([\w-]+):(S\d+(?:-S\d+)?)/g;

  parse(text: string): Anchor[] {
    const anchors: Anchor[] = [];
    let match;

    while ((match = this.anchorPattern.exec(text)) !== null) {
      const keyword = match[1];
      const thoughtRef = match[2];
      const thoughtNumbers = this.parseThoughtRef(thoughtRef);

      anchors.push({
        raw: match[0],
        keyword,
        thoughtRef,
        thoughtNumbers
      });
    }

    return anchors;
  }

  private parseThoughtRef(ref: string): number[] {
    if (ref.includes('-')) {
      // Range: S25-S30
      const [start, end] = ref.split('-').map(s => parseInt(s.replace('S', '')));
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else {
      // Single: S25
      return [parseInt(ref.replace('S', ''))];
    }
  }
}
```

### Anchor Resolver

**New File**: `src/references/anchor-resolver.ts`

```typescript
export interface ResolvedAnchor {
  anchor: Anchor;
  status: "resolved" | "ambiguous" | "unresolved";
  candidates: Array<{
    sessionId: string;
    title: string;
    thoughtCount: number;
    createdAt: string;
    matchReason: "tag" | "title" | "content" | "alias";
    confidence: number;  // 0.0 to 1.0
  }>;
  selected?: {
    sessionId: string;
    thoughts: Array<{ thoughtNumber: number; thought: string }>;
  };
}

export class AnchorResolver {
  constructor(
    private storage: ThoughtboxStorage,
    private aliasConfig?: Record<string, string>
  ) {}

  async resolve(anchor: Anchor): Promise<ResolvedAnchor> {
    // 1. Check aliases first (highest confidence)
    if (this.aliasConfig && this.aliasConfig[anchor.keyword]) {
      return this.resolveViaAlias(anchor, this.aliasConfig[anchor.keyword]);
    }

    // 2. Search sessions
    const candidates = await this.searchSessions(anchor.keyword);

    // 3. Categorize result
    if (candidates.length === 0) {
      return { anchor, status: "unresolved", candidates: [] };
    }

    if (candidates.length === 1 || candidates[0].confidence > 0.9) {
      return this.resolveSingle(anchor, candidates[0]);
    }

    return { anchor, status: "ambiguous", candidates };
  }

  private async searchSessions(keyword: string): Promise<Candidate[]> {
    const allSessions = await this.storage.listSessions();
    const candidates: Candidate[] = [];

    for (const session of allSessions) {
      // Tag match (highest confidence)
      if (session.tags?.includes(keyword)) {
        candidates.push({
          sessionId: session.id,
          title: session.title,
          thoughtCount: session.thoughtCount,
          createdAt: session.createdAt,
          matchReason: "tag",
          confidence: 0.95
        });
        continue;
      }

      // Title fuzzy match
      const titleSimilarity = this.fuzzyMatch(keyword, session.title);
      if (titleSimilarity > 0.7) {
        candidates.push({
          ...session,
          matchReason: "title",
          confidence: titleSimilarity * 0.85  // slightly lower than tag
        });
        continue;
      }

      // Content search (lowest confidence, expensive)
      // TODO: Could search thought content but may be slow
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  private fuzzyMatch(keyword: string, text: string): number {
    // Simple Levenshtein-based or word overlap
    const keywordWords = keyword.toLowerCase().split('-');
    const textWords = text.toLowerCase().split(/\s+/);

    const matches = keywordWords.filter(kw =>
      textWords.some(tw => tw.includes(kw) || kw.includes(tw))
    );

    return matches.length / keywordWords.length;
  }
}
```

### Integration with Thought Export

**File**: `src/session-handler.ts` (modify export operation)

```typescript
async exportSession(sessionId: string): Promise<SessionExport> {
  const session = await this.storage.getSession(sessionId);
  const parser = new AnchorParser();
  const resolver = new AnchorResolver(this.storage, this.loadAliases());

  // Parse all anchors in session
  const allAnchors: Map<number, ResolvedAnchor[]> = new Map();

  for (const node of session.nodes) {
    const anchors = parser.parse(node.data.thought);
    if (anchors.length > 0) {
      const resolved = await Promise.all(
        anchors.map(a => resolver.resolve(a))
      );
      allAnchors.set(node.data.thoughtNumber, resolved);
    }
  }

  return {
    ...session,
    crossReferences: {
      anchorsFound: allAnchors.size,
      resolved: Array.from(allAnchors.values()).flat().filter(a => a.status === "resolved").length,
      ambiguous: Array.from(allAnchors.values()).flat().filter(a => a.status === "ambiguous").length,
      unresolved: Array.from(allAnchors.values()).flat().filter(a => a.status === "unresolved").length,
      details: Array.from(allAnchors.entries()).map(([thoughtNum, anchors]) => ({
        thoughtNumber: thoughtNum,
        anchors
      }))
    }
  };
}
```

---

## Acceptance Criteria

**AC-001**: Semantic anchors parse correctly
```typescript
const text = "Building on @phenomenology:S25-S30 and @revision:S89";
const anchors = parser.parse(text);

// Expected
[
  { keyword: "phenomenology", thoughtNumbers: [25,26,27,28,29,30] },
  { keyword: "revision", thoughtNumbers: [89] }
]
```

**AC-002**: Anchors resolve via tag match
```typescript
// Given session with tag "agent-phenomenology"
const resolved = await resolver.resolve({ keyword: "agent-phenomenology", ... });

// Expected
{ status: "resolved", candidates: [{ matchReason: "tag", confidence: 0.95 }] }
```

**AC-003**: Ambiguous anchors return multiple candidates
```typescript
// Given 2 sessions titled "Revision Patterns" and "Revision Analysis"
const resolved = await resolver.resolve({ keyword: "revision", ... });

// Expected
{ status: "ambiguous", candidates: [{ title: "...", confidence: 0.82 }, ...] }
```

**AC-004**: Unresolved anchors preserve context
```typescript
// Given no matching sessions
const resolved = await resolver.resolve({ keyword: "nonexistent", ... });

// Expected
{ status: "unresolved", candidates: [] }

// In export
"[unresolved: @nonexistent:S42] - original context preserved"
```

---

## User Workflow

### Writing Phase (No Friction)
```
Agent reasoning:
"This builds on @phenomenology:S25 which identified..."

System:
- Stores anchor as-is in thought text
- No validation, no resolution
- Fast, doesn't interrupt flow
```

### Reading Phase (Resolution)
```
Export session:
1. System finds @phenomenology anchor
2. Searches sessions with "phenomenology" in tag/title
3. Finds session a3d80d32
4. Includes in export metadata:
   {
     "anchor": "@phenomenology:S25",
     "resolved": {
       "sessionId": "a3d80d32...",
       "title": "Agent Phenomenology: Ready-to-Hand for AI",
       "thoughts": [25]
     }
   }
```

### Ambiguous Resolution
```
If multiple matches:
1. System returns candidates
2. Application shows to user:
   "Anchor @revision:S89 matches:
    [1] In-Flight Revision Patterns (116 thoughts, 3 days ago)
    [2] Revision Analysis Deep Dive (45 thoughts, 1 week ago)"
3. User selects
4. Resolution cached for future exports
```

---

## Implementation Phases

### Phase 1: Basic Anchor Support
- Parse anchors in thought text
- Store without resolution
- Export shows raw anchors

### Phase 2: Resolution Engine
- Implement search by tag/title
- Resolve at export time
- Handle unresolved gracefully

### Phase 3: Alias System
- Load aliases from config
- Prioritize alias matches
- Provide alias management operations

### Phase 4: Interactive Disambiguation
- Return ambiguous candidates
- Cache user selections
- Learn from resolution patterns

---

## Risk Assessment

**Medium-High Risk**:
- Search accuracy depends on tag/title quality
- Ambiguity resolution needs user interaction design
- Performance at scale (hundreds of sessions)

**Mitigations**:
- Start with simple fuzzy matching, iterate based on usage
- Provide good defaults (tag match > title match)
- Build search index for performance
- Make resolution optional (can work without it)

---

## Design Decisions

**D1**: Anchor syntax - **RESOLVED: Convention Only**
- **Decision**: Free-form text, parse on export (Option B)
- **Rationale**: Less friction during reasoning flow (discussed with user)
- **Impact**: No validation during thought creation, resolution deferred

**D2**: Resolution cache scope - **RESOLVED: In-Memory MVP**
- **Decision**: Per-session in-memory cache for MVP (Option A)
- **Rationale**: Simpler implementation, add persistence if performance issues arise
- **Impact**: Cache cleared on server restart (acceptable for MVP)

**D3**: Alias scope - **RESOLVED: Project-Level**
- **Decision**: Project-scoped aliases in `.thoughtbox/aliases.json`
- **Rationale**: Enables team coordination, persistent across sessions
- **Impact**: One alias namespace per project

**D4**: Search Algorithm - **RESOLVED: Multi-Strategy with Fallback**
- **Decision**: Tiered search with confidence scoring
- **Strategy**:
  1. Alias exact match (confidence: 1.0) - O(1) lookup
  2. Tag exact match (confidence: 0.95) - O(n) tags scan
  3. Title word overlap (confidence: 0.60-0.90) - O(n) fuzzy match
  4. Fall back to error if no match > 0.60 threshold
- **Performance**: Tag index for O(1) tag lookups, title scan acceptable for <1000 sessions
- **Impact**: Predictable search quality, fast for common cases

**D5**: Disambiguation Strategy - **RESOLVED: Return Candidates, No Elicitation**
- **Decision**: Return all candidates with confidence scores, let client/app handle selection
- **Rationale**:
  - Simpler than MCP elicitation
  - Client can choose UX (prompt user, auto-select highest, error on ambiguity)
  - Server stays transport-agnostic
- **Impact**: Export includes `ambiguous` candidates array, client responsibility to resolve

**D6**: Performance Strategy - **RESOLVED: Lazy Indexing**
- **Decision**: Build tag index on first search, cache in memory
- **Index Structure**: `Map<tag, sessionId[]>` for O(1) tag lookups
- **Rebuild**: On session list change notification
- **Performance Target**: <100ms for tag match, <500ms for title fuzzy match
- **Impact**: First search slower (builds index), subsequent searches fast

---

## Backwards Compatibility

**Existing Sessions**: Work unchanged
- Can be referenced FROM new sessions
- Don't contain anchor syntax (until manually added)

**Asymmetric Design** (as discussed):
- New sessions → reference → old sessions ✅
- Old sessions → reference → new sessions ❌ (unless manually updated)

This is the natural direction of knowledge flow.

---

## References

- Discussion with user on cross-session reference design
- Exploration S140, S229: Cross-session learning patterns
- Exploration S163: Building on prior work
- MCP spec: Resource templates support parameterized URIs
- Research: GraphRAG patterns for entity resolution

---

**Ready for Implementation**: YES ✅
**All Design Decisions Resolved** (D1-D6):
- Search algorithm: Multi-strategy with confidence thresholds
- Disambiguation: Return candidates, client handles selection
- Performance: Lazy tag indexing, acceptable for <1000 sessions

**Confidence Score**: 0.90 (increased from 0.75 after resolving blockers)
**Implementation Path**: Proceed with tiered search strategy, monitor performance in production
