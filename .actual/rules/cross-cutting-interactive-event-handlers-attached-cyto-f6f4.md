---
version: 2
name: cross-cutting-interactive-event-handlers-attached-cyto-f6f4
description: "Cytoscape for Interactive Graph Visualization: Interactive Event Handlers Attached Cytoscape Delegation"
metadata:
  actual:
    adr_id: f6f478f3-9476-49ad-be59-7a08f254edf9
    status: accepted
    candidate_group_id: 2b47da57-6088-4e52-9c0d-d4349e40c671
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape for Interactive Graph Visualization: Interactive Event Handlers Attached Cytoscape Delegation

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CYTO-001** MUST: Interactive event handlers MUST be attached using Cytoscape event delegation methods and MUST be explicitly unregistered when the hosting component unmounts.
- **R-CYTO-002** MUST: Register all external layout extensions and middleware plugins with the core Cytoscape library prior to mounting graph viewports.
- **R-CYTO-003** MUST: Implement element transformation utilities as pure functions that convert domain entities to Cytoscape element descriptors without introducing component state dependencies.
- **R-CYTO-004** MUST: Organize graph visual styling as declarative selector-property definitions in dedicated configuration modules to maintain clean separation from runtime layout parameters.

### Verify

```bash
# Discover and execute static analysis, type checking, and unit/integration test suites for graph modules
# (Commands to be discovered from project repository manifest and build tools)
```

**Accept when:**
- All graph data transformation adapters pass automated unit tests validating expected Cytoscape node and edge structures.
- Graph UI components successfully initialize the Cytoscape runtime with configured layouts and release all instance resources upon unmounting.
- The project static analysis and type checking suites complete with zero errors across all graph-related modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration checks, type checking, unit test suites, and peer code review.
</enforcement>