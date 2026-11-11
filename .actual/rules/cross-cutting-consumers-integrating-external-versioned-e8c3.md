---
version: 2
name: cross-cutting-consumers-integrating-external-versioned-e8c3
description: "Adoption of graphQueries Domain Module for Knowledge Graph Data Operations: Consumers Integrating External Versioned Runtime Dependencies"
metadata:
  actual:
    adr_id: e8c3ea97-d00f-4260-bb81-c84a71cd3901
    status: accepted
    candidate_group_id: e92e90d9-098b-40a6-b7be-8d7edcd069e7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of graphQueries Domain Module for Knowledge Graph Data Operations: Consumers Integrating External Versioned Runtime Dependencies

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for client components within the knowledge feature domain presenting or manipulating knowledge graph entities and structures.

### Rules

- **R-GRAPH-001** MUST: Consumers integrating with external or versioned runtime dependencies MUST discover the ecosystem lock artifact and verify resolved versions prior to implementation.

### Verify

```bash
# Inspect the workspace configuration to locate the project test runner and execute unit tests validating the graphQueries module.
# Discover and run the project static analysis checks to ensure all knowledge domain components import graph access routines through the designated query module.
```

**Accept when:**
- All knowledge UI components access graph data strictly through exported functions from the graphQueries module
- Project static analysis and module verification suites execute with zero violations

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests introducing inline query logic or bypassing the domain query module are blocked from merging.
</enforcement>