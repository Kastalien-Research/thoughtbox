---
version: 2
name: cross-cutting-developers-isolate-graph-data-transforma-d9e1
description: "Cytoscape for Interactive Graph Visualization: Developers Isolate Graph Data Transformation Dedicated"
metadata:
  actual:
    adr_id: d9e1d3ef-9ac9-4227-b513-d2477cfafeea
    status: accepted
    candidate_group_id: 2b47da57-6088-4e52-9c0d-d4349e40c671
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape for Interactive Graph Visualization: Developers Isolate Graph Data Transformation Dedicated

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CYTO-001** MUST: Developers MUST isolate graph data transformation into dedicated adapter functions that map domain query results into normalized Cytoscape node and edge element collections.

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
Claude Code MUST NOT skip or defer verification. All graph data transformations and Cytoscape lifecycle management must be strictly verified via automated type checking, unit tests, and peer code review.
</enforcement>