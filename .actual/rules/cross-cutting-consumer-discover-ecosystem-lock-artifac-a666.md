---
version: 2
name: cross-cutting-consumer-discover-ecosystem-lock-artifac-a666
description: "Cytoscape for Interactive Graph Visualization: Consumer Discover Ecosystem Lock Artifact Verify"
metadata:
  actual:
    adr_id: a666dd1d-e0e3-4e33-bb50-e54960c99260
    status: accepted
    candidate_group_id: 2b47da57-6088-4e52-9c0d-d4349e40c671
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape for Interactive Graph Visualization: Consumer Discover Ecosystem Lock Artifact Verify

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CYTO-001** MUST: The consumer MUST discover the ecosystem lock artifact and verify the exact resolved version of Cytoscape and its layout extensions before implementing or modifying graph integration code.
- **R-CYTO-002** MUST: Register all external layout extensions and middleware plugins with the core Cytoscape library prior to mounting graph viewports.
- **R-CYTO-003** MUST: Implement element transformation utilities as pure functions that convert domain entities to Cytoscape element descriptors without introducing component state dependencies.
- **R-CYTO-004** MUST: Organize graph visual styling as declarative selector-property definitions in dedicated configuration modules to maintain clean separation from runtime layout parameters.
- **R-CYTO-005** MUST: Enforce explicit instance disposal and listener cleanup inside component teardown routines to prevent memory retention and event listener leaks.

### Verify

```bash
# Discover and execute the project static analysis and type checking suite to verify Cytoscape interface contracts and type definitions across graph modules.
# Discover and execute unit testing routines for element transformation adapters to verify correct mapping of domain entities into graph node and edge objects.
# Discover and execute component integration test suites to validate client-side graph initialization, event delegation, and unmount lifecycle cleanup.
```

**Accept when:**
- All graph data transformation adapters pass automated unit tests validating expected Cytoscape node and edge structures.
- Graph UI components successfully initialize the Cytoscape runtime with configured layouts and release all instance resources upon unmounting.
- The project static analysis and type checking suites complete with zero errors across all graph-related modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>