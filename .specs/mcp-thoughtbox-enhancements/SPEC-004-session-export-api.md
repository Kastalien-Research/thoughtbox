# SPEC-004: Session Export API Improvement

**Status**: Draft
**Priority**: HIGH
**Complexity**: Low
**Dependencies**: None

---

## Problem Statement

Session export functionality exists but calling pattern is unclear. During exploration (S10-S12), export failed with "Session undefined not found" due to incorrect parameter nesting.

**Root Cause Analysis**:
- Export handler exists and works correctly (`src/sessions/handlers.ts:173-217`)
- Issue was incorrect calling pattern: passed `sessionId` at top level instead of inside `args`
- Correct: `session({ operation: "export", args: { sessionId: "xxx", format: "json" } })`
- Incorrect: `session({ operation: "export", sessionId: "xxx", format: "json" })` ❌

**Evidence from Exploration**:
- S10-S12: Attempted export with incorrect nesting
- Code review: Handler expects `args.sessionId` (line 185 in handlers.ts)
- Gateway passes `operationArgs` correctly (line 693 in gateway-handler.ts)

---

## Requirements

### Functional Requirements

**REQ-001**: Session export operation MUST accept sessionId parameter explicitly
- **Acceptance**: `session({ operation: "export", sessionId: "xxx", format: "json" })` returns session data
- **Current Issue**: sessionId not properly passed through operation args

**REQ-002**: Export MUST support both file output and direct return
- **Acceptance**:
  - STDIO mode: Writes to file path if provided, returns content
  - HTTP mode: Returns content directly
- **Rationale**: Transport transparency (per MCP principles)

**REQ-003**: Export MUST return complete session graph structure
- **Acceptance**: Response includes:
  - Session metadata (id, title, tags, counts, timestamps)
  - All nodes with graph links (prev, next, branchOrigin, revisesNode)
  - Proper JSON schema validation

**REQ-004**: Export MUST handle session not found gracefully
- **Acceptance**: Clear error message with available sessions listed
- **Current Issue**: Generic "undefined" error

### Non-Functional Requirements

**REQ-005**: Export MUST complete in <5 seconds for sessions with <1000 thoughts
- **Rationale**: Observed session (240 thoughts) should export quickly

**REQ-006**: Export MUST not block other operations
- **Rationale**: Async export for large sessions

---

## Technical Design

### API Surface

```typescript
// Session handler operation signature
interface SessionExportOperation {
  operation: "export";
  sessionId: string;           // Required
  format?: "json" | "markdown"; // Default: json
  path?: string;               // Optional: write to file
}

// Response
interface SessionExportResult {
  success: true;
  sessionId: string;
  content: string;             // Always returned
  path?: string;               // If file was written
  metadata: {
    thoughtCount: number;
    branchCount: number;
    exportedAt: string;
  };
}
```

### Implementation Strategy

**Location**: `src/session-handler.ts`

**Current Code Pattern** (from similar operations):
```typescript
// Based on how other operations work
async handleSessionOperation(operation: string, args: any) {
  if (operation === "export") {
    // FIX: Currently not extracting sessionId from args properly
    const sessionId = args.sessionId;  // Add this

    if (!sessionId) {
      throw new Error("sessionId required for export operation");
    }

    // Use existing export logic but with proper sessionId
    const session = await this.storage.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Generate export content
    const content = JSON.stringify(session, null, 2);

    // Write to file if path provided
    if (args.path) {
      await fs.writeFile(args.path, content);
    }

    return {
      success: true,
      sessionId,
      content,
      path: args.path,
      metadata: {
        thoughtCount: session.thoughtCount,
        branchCount: session.branchCount,
        exportedAt: new Date().toISOString()
      }
    };
  }
}
```

---

## Acceptance Criteria

**AC-001**: Given a valid sessionId, export returns complete session data
```bash
# Test
session({ operation: "export", sessionId: "46797ffd..." })

# Expected
{ success: true, content: "{...}", metadata: {...} }
```

**AC-002**: Given invalid sessionId, export returns helpful error
```bash
# Test
session({ operation: "export", sessionId: "nonexistent" })

# Expected
Error: "Session nonexistent not found. Available sessions: [list]"
```

**AC-003**: Export with path writes file and returns content
```bash
# Test
session({ operation: "export", sessionId: "xxx", path: "/tmp/export.json" })

# Expected
File written + content returned in response
```

---

## Testing Strategy

### Unit Tests
- `session-handler.test.ts`: Test export operation with valid/invalid sessionIds
- Verify error handling for missing sessionId
- Verify content structure matches schema

### Integration Tests
- Export session after creating thoughts
- Verify exported JSON can be re-imported
- Test both STDIO and HTTP transport modes

### Regression Prevention
- Add to behavioral tests: `tests/thoughtbox/12-session-export.md`
- Ensure export works for sessions with branches and revisions

---

## Migration Notes

**Breaking Changes**: None - this fixes existing functionality

**Backwards Compatibility**: Existing sessions export without modification

---

## Open Questions

None - straightforward bug fix based on observed behavior

---

## References

- Exploration session S10-S12: First export attempt failure
- Exploration session S249: Session close indicated export path but inaccessible
- Current code: `src/session-handler.ts` (needs sessionId extraction fix)
- MCP docs: Resource export pattern (similar to notebook export)

---

**Ready for Implementation**: YES ✅
**Confidence Score**: 0.95
