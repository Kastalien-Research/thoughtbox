---
version: 2
name: cross-cutting-client-components-not-construct-hoc-1310
description: "Adoption of graphQueries Domain Module for Knowledge Graph Data Operations: Client Components Not Construct Hoc Database"
metadata:
  actual:
    adr_id: 1310e8b9-d4d8-44a8-bd24-f93d18c4b8fa
    status: accepted
    candidate_group_id: e92e90d9-098b-40a6-b7be-8d7edcd069e7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of graphQueries Domain Module for Knowledge Graph Data Operations: Client Components Not Construct Hoc Database

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-KGQ-001** MUST_NOT: Client components MUST_NOT construct ad-hoc database queries or unabstracted graph queries directly inside render trees or interaction handlers.

### Verify

```bash
# Inspect the workspace configuration to locate the project test runner and execute unit tests validating the graphQueries module.
# Discover and run the project static analysis checks to ensure all knowledge domain components import graph access routines through the designated query module.
```

**Accept when:**
- All knowledge UI components access graph data strictly through exported functions from the graphQueries module
- Project static analysis and module verification suites execute with zero violations

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>