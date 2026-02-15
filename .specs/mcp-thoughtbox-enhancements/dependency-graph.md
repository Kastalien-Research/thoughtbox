# Dependency Graph
## MCP Thoughtbox Enhancements

```mermaid
graph TD
    SPEC-004[SPEC-004: Session Export API<br/>Priority: HIGH | Complexity: LOW<br/>Ready: ✅]
    SPEC-001[SPEC-001: Resource Templates<br/>Priority: HIGH | Complexity: MEDIUM<br/>Ready: ✅]
    SPEC-002[SPEC-002: Revision Chains<br/>Priority: HIGH | Complexity: MEDIUM<br/>Ready: ✅]
    SPEC-003[SPEC-003: Cross-Session Refs<br/>Priority: HIGH | Complexity: HIGH<br/>Ready: ⚠️]

    SPEC-004 -.->|independent| SPEC-001
    SPEC-001 -->|required for search| SPEC-003
    SPEC-001 -.->|optional template| SPEC-002
    SPEC-002 -.->|revision chains may span| SPEC-003

    classDef ready fill:#90EE90
    classDef partial fill:#FFD700
    class SPEC-004,SPEC-001,SPEC-002 ready
    class SPEC-003 partial
```

## Implementation Order

### Recommended Sequence

1. **SPEC-004** (Session Export API)
   - **Why first**: Fixes current bug, independent of others
   - **Effort**: 1 day
   - **Risk**: Low

2. **SPEC-001** (Resource Templates)
   - **Why second**: Foundation for other features
   - **Blocks**: SPEC-003 (required), SPEC-002 (optional)
   - **Effort**: 2 days
   - **Risk**: Low-Medium

3. **SPEC-002** (Revision Chains)
   - **Why third**: Depends on SPEC-001 optionally
   - **Blocks**: Nothing (SPEC-003 dependency is optional)
   - **Effort**: 2-3 days
   - **Risk**: Medium

4. **SPEC-003** (Cross-Session References)
   - **Why last**: Depends on SPEC-001 + SPEC-002, needs design refinement
   - **Effort**: 3-4 days
   - **Risk**: High (search algorithm needs prototyping)

### Alternative: Parallel Tracks

**Track A (Core Infrastructure)**:
```
SPEC-004 → SPEC-001 (no blockers, can implement in parallel with Track B)
```

**Track B (Visualization)**:
```
SPEC-002 (can start independently, benefits from SPEC-001 later)
```

**Track C (Advanced Features)**:
```
SPEC-003 (start after SPEC-001 complete)
```

## Dependency Details

### SPEC-001 → SPEC-003

**Type**: Hard dependency
**Reason**: Cross-session search requires session metadata query (SPEC-001 provides this)
**Alternative**: SPEC-003 could implement own search, but duplicates effort

### SPEC-001 → SPEC-002

**Type**: Soft dependency
**Reason**: Revision queries could use resource template, but could also be direct operation
**Recommendation**: Implement SPEC-002 revision queries as resource template (cleaner)

### SPEC-002 → SPEC-003

**Type**: Soft dependency
**Reason**: If revision chains span sessions, cross-session refs help navigate
**Impact**: Low - SPEC-003 works without SPEC-002, just less useful

---

## Risk Nodes

**SPEC-003** is the highest-risk node:
- Complexity: HIGH
- Confidence: 0.75 (below threshold)
- Design decisions still open

**Mitigation**: Implement SPEC-001, SPEC-002, SPEC-004 first. Prototype SPEC-003 search in isolation, validate before full implementation.
