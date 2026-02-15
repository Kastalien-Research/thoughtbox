# Specification Inventory
## MCP Thoughtbox Enhancements

**Source**: EXPLORATION_REPORT_MCP_Integration_Patterns.md
**Generated**: 2026-01-21
**Total Specs**: 4

---

## Spec Overview

| ID | Name | Priority | Complexity | Dependencies |
|----|------|----------|------------|--------------|
| SPEC-001 | Resource Templates for Thought Graph Queries | HIGH | Medium | None |
| SPEC-002 | Revision Chain Exposure and Visualization | HIGH | Medium | SPEC-001 (optional) |
| SPEC-003 | Cross-Session Reference System | HIGH | High | SPEC-001, SPEC-002 |
| SPEC-004 | Session Export API Improvement | HIGH | Low | None |

---

## SPEC-001: Resource Templates for Thought Graph Queries

**Purpose**: Enable dynamic, parameterized queries over the thought graph using MCP resource templates

**Key Capabilities**:
- Query thoughts by type: `thoughtbox://thoughts/{sessionId}/{type}`
- Filter by tags: `thoughtbox://sessions/{project}/{tag}`
- Get revision history: `thoughtbox://revisions/{thoughtNumber}`
- Reference queries: `thoughtbox://references/{thoughtNumber}`

**Dependencies**: None

**Implementation Files**:
- `src/resources/thought-query-handler.ts` (new)
- `src/server-factory.ts` (modify - register templates)

---

## SPEC-002: Revision Chain Exposure and Visualization

**Purpose**: Make revision history visible as a tree structure showing conceptual evolution

**Key Capabilities**:
- Expose revision chains via resources
- Show semantic versioning (S1 → S43 → S89 → S98)
- Track refinement layers
- Export revision tree as graph

**Dependencies**: SPEC-001 (optional - could use as resource template)

**Implementation Files**:
- `src/resources/revision-chain-handler.ts` (new)
- `src/thought-handler.ts` (modify - track revision lineage)
- `src/persistence/types.ts` (modify - add revision metadata)

---

## SPEC-003: Cross-Session Reference System

**Purpose**: Enable semantic anchors that reference thoughts across sessions with lazy resolution

**Key Capabilities**:
- Parse semantic anchor syntax: `@keyword:SN`
- Resolve anchors to session IDs via tag/title search
- Support optional alias system
- Handle broken references gracefully

**Dependencies**:
- SPEC-001 (resource templates for search)
- SPEC-002 (revision chains may span sessions)

**Implementation Files**:
- `src/references/anchor-resolver.ts` (new)
- `src/references/anchor-parser.ts` (new)
- `src/session-handler.ts` (modify - add alias management)
- `src/persistence/types.ts` (modify - add anchor metadata)

---

## SPEC-004: Session Export API Improvement

**Purpose**: Fix current session export API to reliably retrieve session data

**Key Capabilities**:
- Clear export operation that returns session JSON
- Support export to file path (STDIO mode)
- Return content directly (HTTP mode)
- Consistent error handling

**Dependencies**: None (independent fix)

**Implementation Files**:
- `src/session-handler.ts` (fix export operation)
- `src/server-factory.ts` (ensure session tool properly registered)

---

## Implementation Order

```
SPEC-004 (Session Export)     ← Fix current issue first
    ↓
SPEC-001 (Resource Templates)  ← Foundation for queries
    ↓
SPEC-002 (Revision Chains)     ← Builds on query capability
    ↓
SPEC-003 (Cross-Session Refs)  ← Requires search + chains
```

---

## Scope Boundaries

**In Scope**:
- Server-side enhancements to Thoughtbox MCP server
- New resource types and templates
- Enhanced session management
- Reference resolution mechanisms

**Out of Scope**:
- Client-side UI changes
- Frontend visualization tools
- Changes to cipher notation syntax
- Modifications to core thought storage format

---

## Confidence Assessment

| Spec | Clarity | Feasibility | Completeness |
|------|---------|-------------|--------------|
| SPEC-001 | HIGH (0.95) | HIGH (0.90) | MEDIUM (0.75) |
| SPEC-002 | HIGH (0.90) | MEDIUM (0.80) | MEDIUM (0.70) |
| SPEC-003 | MEDIUM (0.75) | MEDIUM (0.70) | LOW (0.60) |
| SPEC-004 | HIGH (0.95) | HIGH (0.95) | HIGH (0.90) |

**Overall Readiness**: 0.81 (above 0.85 threshold for SPEC-004, SPEC-001, SPEC-002)

**Note**: SPEC-003 needs design refinement on anchor resolution strategy.
