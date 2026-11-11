---
version: 2
name: cross-cutting-visualization-components-not-invoke-layo-7b33
description: "Cytoscape Extension Registration via cytoscape.use: Visualization Components Not Invoke Layout Algorithms"
metadata:
  actual:
    adr_id: 7b33c432-65e5-40a2-96d0-fa2a9743ba75
    status: accepted
    candidate_group_id: 943a135e-e97a-4ba5-90be-f7c89f0c757d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape Extension Registration via cytoscape.use: Visualization Components Not Invoke Layout Algorithms

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CYTO-001** MUST_NOT: Visualization components MUST NOT invoke layout algorithms that have not been explicitly registered via cytoscape.use.

### Verify

```bash
echo "Execute discovered repository test commands for graph visualization components"
echo "Execute discovered repository static type checking and linting commands"
```

**Accept when:**
- Graph visualization components successfully render with the registered layout extension without runtime initialization errors.
- All project verification and test commands pass without extension registration warnings.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>