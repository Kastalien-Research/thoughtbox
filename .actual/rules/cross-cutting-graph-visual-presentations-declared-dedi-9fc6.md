---
version: 2
name: cross-cutting-graph-visual-presentations-declared-dedi-9fc6
description: "Cytoscape for Interactive Graph Visualization: Graph Visual Presentations Declared Dedicated Stylesheet"
metadata:
  actual:
    adr_id: 9fc613c7-104e-4efe-9d2a-0946fe6c66bd
    status: accepted
    candidate_group_id: 2b47da57-6088-4e52-9c0d-d4349e40c671
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape for Interactive Graph Visualization: Graph Visual Presentations Declared Dedicated Stylesheet

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CYTO-001** MUST: Graph visual presentations MUST be declared in dedicated stylesheet definition modules separated from component rendering templates.

### Verify

```bash
# Discover and execute the project static analysis and type checking suite
# Discover and execute unit testing routines for element transformation adapters
# Discover and execute component integration test suites
```

**Accept when:**
- All graph data transformation adapters pass automated unit tests validating expected Cytoscape node and edge structures.
- Graph UI components successfully initialize the Cytoscape runtime with configured layouts and release all instance resources upon unmounting.
- The project static analysis and type checking suites complete with zero errors across all graph-related modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>