# SPEC-001: Resource Templates for Thought Graph Queries

**Status**: Draft
**Priority**: HIGH
**Complexity**: Medium
**Dependencies**: None

---

## Problem Statement

Currently, the only way to access thought data is by:
1. Calling `thought` tool iteratively (returns minimal response)
2. Exporting entire session (all-or-nothing)

There's no way to query the thought graph dynamically:
- "Give me all hypotheses from this session"
- "Show me thoughts that reference S87"
- "What are the last 50 thoughts?"

**Evidence from Exploration**:
- S239-S240: Identified resource templates as solution pattern
- S187-S188: GraphRAG shows queryable graph patterns
- S142: Knowledge graph research shows importance of query interfaces

---

## Requirements

### Functional Requirements

**REQ-001**: Implement thought type filtering resource template
- **Template**: `thoughtbox://thoughts/{sessionId}/{type}`
- **Parameters**:
  - `sessionId`: UUID of session
  - `type`: H | E | C | Q | R | P | O | A | X
- **Returns**: Array of thoughts matching type
- **Example**: `thoughtbox://thoughts/46797ffd.../H` → all hypotheses

**REQ-002**: Implement session filtering by metadata
- **Template**: `thoughtbox://sessions/{project}/{tag}`
- **Parameters**:
  - `project`: Project name (from bound root)
  - `tag`: Tag value
- **Returns**: Array of sessions matching criteria
- **Example**: `thoughtbox://sessions/thoughtbox/meta-cognitive` → filtered sessions

**REQ-003**: Implement revision history query
- **Template**: `thoughtbox://revisions/{sessionId}/{thoughtNumber}`
- **Parameters**:
  - `sessionId`: UUID of session
  - `thoughtNumber`: Original thought number
- **Returns**: Array of all revisions of that thought, ordered chronologically
- **Example**: `thoughtbox://revisions/46797ffd.../1` → [S1, S43, S89, S98]

**REQ-004**: Implement reference query (what references this thought?)
- **Template**: `thoughtbox://references/{sessionId}/{thoughtNumber}`
- **Parameters**:
  - `sessionId`: UUID
  - `thoughtNumber`: Target thought
- **Returns**: Array of thoughts that reference this thought
- **Example**: `thoughtbox://references/46797ffd.../44` → [S89, S135, S178]

**REQ-005**: Implement range query
- **Template**: `thoughtbox://thoughts/{sessionId}/range/{start}-{end}`
- **Parameters**:
  - `sessionId`: UUID
  - `start`, `end`: Thought numbers
- **Returns**: Thoughts in range [start, end] inclusive
- **Example**: `thoughtbox://thoughts/46797ffd.../range/100-150`

### Non-Functional Requirements

**REQ-006**: Query response time MUST be <1 second for sessions with <1000 thoughts
- **Rationale**: Interactive use case

**REQ-007**: Template parameter completion MUST suggest valid values
- **Acceptance**: Typing "H" suggests hypothesis types, typing "meta" suggests matching tags
- **Mechanism**: MCP `completion/complete` method

**REQ-008**: Invalid template parameters MUST return clear errors
- **Example**: Unknown type "Z" → "Invalid type 'Z'. Valid types: H, E, C, Q, R, P, O, A, X"

---

## Technical Design

### Resource Template Registration

**Location**: `src/server-factory.ts`

```typescript
// Register resource templates in server factory
server.registerResourceTemplate({
  uriTemplate: "thoughtbox://thoughts/{sessionId}/{type}",
  name: "thoughts-by-type",
  title: "Query Thoughts by Type",
  description: "Filter thoughts by semantic type (H/E/C/Q/R/P/O/A/X)",
  mimeType: "application/json"
});

server.registerResourceTemplate({
  uriTemplate: "thoughtbox://sessions/{project}/{tag}",
  name: "sessions-by-metadata",
  title: "Query Sessions by Metadata",
  description: "Find sessions matching project and tag",
  mimeType: "application/json"
});

server.registerResourceTemplate({
  uriTemplate: "thoughtbox://revisions/{sessionId}/{thoughtNumber}",
  name: "revision-history",
  title: "Get Revision History",
  description: "Retrieve all revisions of a specific thought",
  mimeType: "application/json"
});

server.registerResourceTemplate({
  uriTemplate: "thoughtbox://references/{sessionId}/{thoughtNumber}",
  name: "thought-references",
  title: "Get Thought References",
  description: "Find all thoughts that reference this thought",
  mimeType: "application/json"
});

server.registerResourceTemplate({
  uriTemplate: "thoughtbox://thoughts/{sessionId}/range/{start}-{end}",
  name: "thought-range",
  title: "Get Thought Range",
  description: "Retrieve thoughts in specified range",
  mimeType: "application/json"
});
```

### Query Handler Implementation

**New File**: `src/resources/thought-query-handler.ts`

```typescript
export class ThoughtQueryHandler {
  constructor(private storage: ThoughtboxStorage) {}

  async handleQuery(uri: string): Promise<any> {
    const parsed = this.parseURI(uri);

    switch (parsed.template) {
      case "thoughts-by-type":
        return this.queryByType(parsed.params.sessionId, parsed.params.type);

      case "sessions-by-metadata":
        return this.querySessionsByMetadata(parsed.params.project, parsed.params.tag);

      case "revision-history":
        return this.getRevisionHistory(parsed.params.sessionId, parsed.params.thoughtNumber);

      case "thought-references":
        return this.getReferences(parsed.params.sessionId, parsed.params.thoughtNumber);

      case "thought-range":
        return this.getRange(parsed.params.sessionId, parsed.params.start, parsed.params.end);

      default:
        throw new Error(`Unknown template: ${parsed.template}`);
    }
  }

  private async queryByType(sessionId: string, type: string): Promise<Thought[]> {
    const session = await this.storage.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // Parse cipher type marker from thought content
    const thoughts = session.nodes.filter(node => {
      const match = node.data.thought.match(/^S\d+\|([HECQRPOAX])\|/);
      return match && match[1] === type;
    });

    return thoughts;
  }

  private async getRevisionHistory(sessionId: string, thoughtNumber: number): Promise<Thought[]> {
    const session = await this.storage.getSession(sessionId);
    const revisions: Thought[] = [];

    // Find original thought
    let current = session.nodes.find(n => n.data.thoughtNumber === thoughtNumber);
    if (!current) return revisions;

    revisions.push(current);

    // Follow revision chain
    // Need to track: which thoughts revise this one?
    // Current structure: revisesNode points backward to what this revises
    // Need reverse index: what revises this node?

    // TODO: Build reverse revision index during session load
    // For now: scan all nodes for revisesNode === current.id

    for (const node of session.nodes) {
      if (node.revisesNode === current.id) {
        revisions.push(node);
      }
    }

    return revisions.sort((a, b) =>
      new Date(a.data.timestamp).getTime() - new Date(b.data.timestamp).getTime()
    );
  }

  private async getReferences(sessionId: string, thoughtNumber: number): Promise<Thought[]> {
    const session = await this.storage.getSession(sessionId);
    const target = session.nodes.find(n => n.data.thoughtNumber === thoughtNumber);
    if (!target) return [];

    // Find thoughts that reference this one
    // Parse cipher references: [SN] or S1-S3 patterns
    const refPattern = new RegExp(`\\[?S${thoughtNumber}\\]?|S\\d+-S${thoughtNumber}|S${thoughtNumber}-S\\d+`);

    return session.nodes.filter(node =>
      refPattern.test(node.data.thought)
    );
  }

  private parseURI(uri: string): { template: string; params: Record<string, any> } {
    // Parse URI pattern matching registered templates
    // thoughtbox://thoughts/{sessionId}/{type}
    const patterns = {
      "thoughts-by-type": /^thoughtbox:\/\/thoughts\/([^\/]+)\/([HECQRPOAX])$/,
      "sessions-by-metadata": /^thoughtbox:\/\/sessions\/([^\/]+)\/([^\/]+)$/,
      "revision-history": /^thoughtbox:\/\/revisions\/([^\/]+)\/(\d+)$/,
      "thought-references": /^thoughtbox:\/\/references\/([^\/]+)\/(\d+)$/,
      "thought-range": /^thoughtbox:\/\/thoughts\/([^\/]+)\/range\/(\d+)-(\d+)$/
    };

    for (const [template, pattern] of Object.entries(patterns)) {
      const match = uri.match(pattern);
      if (match) {
        return { template, params: this.extractParams(template, match) };
      }
    }

    throw new Error(`No template matches URI: ${uri}`);
  }
}
```

---

## Acceptance Criteria

**AC-001**: Query by type returns matching thoughts
```typescript
// Given session with thoughts S1|H, S2|E, S3|H
const result = await readResource("thoughtbox://thoughts/SESSION_ID/H");
// Expected: 2 thoughts (S1, S3)
```

**AC-002**: Revision history returns chronological chain
```typescript
// Given S1 revised by S43, revised by S89
const revisions = await readResource("thoughtbox://revisions/SESSION_ID/1");
// Expected: [S1, S43, S89] in timestamp order
```

**AC-003**: Reference query finds all referencing thoughts
```typescript
// Given S89, S135 both reference S44
const refs = await readResource("thoughtbox://references/SESSION_ID/44");
// Expected: [S89, S135]
```

**AC-004**: Range query returns sequential thoughts
```typescript
const range = await readResource("thoughtbox://thoughts/SESSION_ID/range/100-110");
// Expected: Thoughts 100-110 inclusive
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)
- Implement ThoughtQueryHandler class
- Register resource templates
- Support type and range queries only
- Basic error handling

### Phase 2: Enhancement
- Add revision history queries
- Add reference queries
- Implement parameter completion
- Comprehensive error messages

### Phase 3: Optimization
- Build reverse indexes for fast queries
- Cache query results
- Add pagination for large result sets

---

## Dependencies

**Required**:
- Existing session storage mechanism
- MCP SDK resource template support

**Optional**:
- SPEC-002 (revision chains) benefits from revision query
- SPEC-003 (cross-session refs) uses session metadata query

---

## Risk Assessment

**Low Risk**: Building on established MCP patterns (resource templates exist in spec)

**Potential Issues**:
1. Cipher parsing complexity - need robust regex for [SN] patterns
2. Performance at scale - may need indexing for 1000+ thought sessions
3. Revision tracking - current structure may not have reverse pointers

**Mitigations**:
1. Start with simple patterns, iterate based on real usage
2. Add indexes in Phase 3 if needed
3. Build reverse index during session load (small overhead)

---

**Ready for Implementation**: YES ✅
**Estimated Effort**: 1-2 days
**Confidence Score**: 0.90
