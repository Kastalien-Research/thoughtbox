---
version: 2
name: cross-cutting-query-functions-exported-graphqueries-mo-f4e9
description: "Adoption of graphQueries Domain Module for Knowledge Graph Data Operations: Query Functions Exported Graphqueries Module Encapsulate"
metadata:
  actual:
    adr_id: f4e99c69-7acf-40fd-b2c6-f0ea7d481c42
    status: accepted
    candidate_group_id: e92e90d9-098b-40a6-b7be-8d7edcd069e7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of graphQueries Domain Module for Knowledge Graph Data Operations: Query Functions Exported Graphqueries Module Encapsulate

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-GQM-001** SHOULD: Query functions exported by the graphQueries module SHOULD encapsulate response normalization and data mapping required by downstream presentation components.
- **R-GQM-002** MANDATORY: Collocate domain query logic within the knowledge feature library directory alongside related graph transformation adapters.
- **R-GQM-003** MANDATORY: Consume query functions within component lifecycle hooks and memoize derived graph display structures at presentation boundaries.
- **R-GQM-004** MANDATORY: Ensure query functions remain pure data access routines and avoid embedding view-specific presentation logic.

### Verify

```bash
# Inspect the workspace configuration to locate the project test runner and execute unit tests validating the graphQueries module.
# Discover and run the project static analysis checks to ensure all knowledge domain components import graph access routines through the designated query module.
```

**Accept when:**
- All knowledge UI components access graph data strictly through exported functions from the graphQueries module
- Project static analysis and module verification suites execute with zero violations

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by peer review during pull requests, automated static analysis, and type verification in CI pipelines. Pull requests introducing inline query logic or bypassing the domain query module are blocked from merging.
</enforcement>