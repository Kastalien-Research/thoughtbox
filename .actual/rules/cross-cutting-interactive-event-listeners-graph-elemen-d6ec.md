---
version: 2
name: cross-cutting-interactive-event-listeners-graph-elemen-d6ec
description: "Cytoscape Extension Registration via cytoscape.use: Interactive Event Listeners Graph Elements Attached"
metadata:
  actual:
    adr_id: d6ecd3fb-beb5-47d0-8f6d-ea6c54657063
    status: accepted
    candidate_group_id: 943a135e-e97a-4ba5-90be-f7c89f0c757d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape Extension Registration via cytoscape.use: Interactive Event Listeners Graph Elements Attached

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for client-side interactive graph visualization components requiring external layout extensions.

### Rules

- **R-CYTO-001** SHOULD: Interactive event listeners on graph elements SHOULD be attached directly to the graph instance rather than utilizing external DOM event interception.

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