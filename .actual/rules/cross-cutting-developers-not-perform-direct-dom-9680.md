---
version: 2
name: cross-cutting-developers-not-perform-direct-dom-9680
description: "Cytoscape for Interactive Graph Visualization: Developers Not Perform Direct Dom Manipulation"
metadata:
  actual:
    adr_id: 968092b3-c57e-4e5e-838c-42b0e912cfc0
    status: accepted
    candidate_group_id: 2b47da57-6088-4e52-9c0d-d4349e40c671
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape for Interactive Graph Visualization: Developers Not Perform Direct Dom Manipulation

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for interactive network graph rendering within client user interface modules and data structures requiring relational node and edge topology visualization.

### Rules

- **R-CYT-001** MUST_NOT: Developers MUST_NOT perform direct DOM manipulation or canvas mutations outside of the Cytoscape instance management APIs.

### Verify

```bash
# Discover and execute the project static analysis, type checking suite, and unit tests
# (Repository-specific discovery required per project setup)
```

**Accept when:**
- All graph data transformation adapters pass automated unit tests validating expected Cytoscape node and edge structures.
- Graph UI components successfully initialize the Cytoscape runtime with configured layouts and release all instance resources upon unmounting.
- The project static analysis and type checking suites complete with zero errors across all graph-related modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated CI checks and peer code review.
</enforcement>