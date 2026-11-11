---
version: 2
name: cross-cutting-graph-visualization-components-requiring-351c
description: "Cytoscape Extension Registration via cytoscape.use: Graph Visualization Components Requiring External Layout"
metadata:
  actual:
    adr_id: 351cca5a-c265-4fc3-b508-6dedcb2e87f3
    status: accepted
    candidate_group_id: 943a135e-e97a-4ba5-90be-f7c89f0c757d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape Extension Registration via cytoscape.use: Graph Visualization Components Requiring External Layout

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for client-side interactive graph visualization components requiring external layout extensions.

### Rules

- **R-CYTO-001** MUST: Graph visualization components requiring external layout algorithms MUST register layout extensions through cytoscape.use prior to initializing the visualization instance.

### Verify

```bash
echo "Execute discovered repository test commands for graph visualization components"
echo "Execute discovered repository static type checking and linting commands"
```

**Accept when:**
- Graph visualization components successfully render with the registered layout extension without runtime initialization errors.
- All project verification and test commands pass without extension registration warnings.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>