---
version: 2
name: cross-cutting-components-presenting-manipulating-knowl-8947
description: "Adoption of graphQueries Domain Module for Knowledge Graph Data Operations: Components Presenting Manipulating Knowledge Graph Data"
metadata:
  actual:
    adr_id: 89470638-503f-40be-973a-5d7761c499a8
    status: accepted
    candidate_group_id: e92e90d9-098b-40a6-b7be-8d7edcd069e7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of graphQueries Domain Module for Knowledge Graph Data Operations: Components Presenting Manipulating Knowledge Graph Data

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for client components within the knowledge feature domain presenting or manipulating knowledge graph entities and structures.

### Rules

- **R-GRAPH-001** MUST: Components presenting or manipulating knowledge graph data MUST execute all domain data fetching and graph traversal operations through the shared graphQueries module rather than defining raw query logic inline within user interface components.

### Verify

```bash
# Inspect workspace configuration to locate test runner and execute unit tests validating the graphQueries module
# Discover and run project static analysis checks to ensure all knowledge domain components import graph access routines through the designated query module
```

**Accept when:**
- All knowledge UI components access graph data strictly through exported functions from the graphQueries module
- Project static analysis and module verification suites execute with zero violations

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by peer review during pull requests and automated static analysis/type verification in CI pipelines.
</enforcement>