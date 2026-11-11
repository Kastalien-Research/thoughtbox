---
version: 2
name: cross-cutting-graph-rendering-interaction-bindings-exe-05c1
description: "Cytoscape for Interactive Graph Visualization: Graph Rendering Interaction Bindings Execute Exclusively"
metadata:
  actual:
    adr_id: 05c19d55-932b-458b-9264-b37ea3ce4fdc
    status: accepted
    candidate_group_id: 2b47da57-6088-4e52-9c0d-d4349e40c671
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape for Interactive Graph Visualization: Graph Rendering Interaction Bindings Execute Exclusively

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CYTO-001** MUST: Graph rendering and interaction bindings MUST execute exclusively within client-rendered component lifecycles to prevent server execution of canvas or DOM primitives.

### Verify

```bash
# Discover and execute static analysis, type checking, and unit tests for graph modules
# (Commands to be discovered from the repository manifest and tooling)
```

**Accept when:**
- All graph data transformation adapters pass automated unit tests validating expected Cytoscape node and edge structures.
- Graph UI components successfully initialize the Cytoscape runtime with configured layouts and release all instance resources upon unmounting.
- The project static analysis and type checking suites complete with zero errors across all graph-related modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>