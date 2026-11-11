---
version: 2
name: cross-cutting-system-use-cytoscape-core-graph-ca78
description: "Cytoscape for Interactive Graph Visualization: System Use Cytoscape Core Graph Analysis"
metadata:
  actual:
    adr_id: ca78f7af-788f-43e8-b346-a5cd66cb0418
    status: accepted
    candidate_group_id: 2b47da57-6088-4e52-9c0d-d4349e40c671
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape for Interactive Graph Visualization: System Use Cytoscape Core Graph Analysis

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CYTO-001** MUST: The system MUST use Cytoscape as the core graph analysis and rendering engine for interactive network graph visualizations, registering layout extensions via the extension registration API prior to instance initialization.

### Verify

```bash
# Discover and execute project static analysis, type checking, unit tests, and component integration tests for graph modules
```

**Accept when:**
- All graph data transformation adapters pass automated unit tests validating expected Cytoscape node and edge structures.
- Graph UI components successfully initialize the Cytoscape runtime with configured layouts and release all instance resources upon unmounting.
- The project static analysis and type checking suites complete with zero errors across all graph-related modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>