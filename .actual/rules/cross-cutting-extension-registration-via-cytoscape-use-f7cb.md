---
version: 2
name: cross-cutting-extension-registration-via-cytoscape-use-f7cb
description: "Cytoscape Extension Registration via cytoscape.use: Extension Registration Via Cytoscape Use Executed"
metadata:
  actual:
    adr_id: f7cb670e-38ab-47b8-a232-002581b33a2c
    status: accepted
    candidate_group_id: 943a135e-e97a-4ba5-90be-f7c89f0c757d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape Extension Registration via cytoscape.use: Extension Registration Via Cytoscape Use Executed

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for client-side interactive graph visualization components requiring external layout extensions.

### Rules

- **R-EXT-001** SHOULD: Extension registration via cytoscape.use SHOULD be executed at module initialization scope rather than within recurring component render cycles to prevent redundant middleware registration.

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