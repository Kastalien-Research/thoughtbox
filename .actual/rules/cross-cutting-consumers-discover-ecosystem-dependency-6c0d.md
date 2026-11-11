---
version: 2
name: cross-cutting-consumers-discover-ecosystem-dependency-6c0d
description: "Cytoscape Extension Registration via cytoscape.use: Consumers Discover Ecosystem Dependency Manifest Authoritative"
metadata:
  actual:
    adr_id: 6c0d7440-485b-49d7-b1c0-864626570046
    status: accepted
    candidate_group_id: 943a135e-e97a-4ba5-90be-f7c89f0c757d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape Extension Registration via cytoscape.use: Consumers Discover Ecosystem Dependency Manifest Authoritative

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for client-side interactive graph visualization components requiring external layout extensions.

### Rules

- **R-CYT-001** MUST: Consumers MUST discover the ecosystem dependency manifest and authoritative lock artifact to verify the exact resolved versions of the graph visualization core library and associated layout extensions before invoking extension registration APIs.
- **R-CYT-002** MUST: Register all graph extensions prior to instantiating graph components or executing layout directives.
- **R-CYT-003** MUST: Structure event handlers on graph elements using native graph event listener bindings to maintain unified interaction lifecycles.

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