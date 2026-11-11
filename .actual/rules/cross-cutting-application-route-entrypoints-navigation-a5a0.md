---
version: 2
name: cross-cutting-application-route-entrypoints-navigation-a5a0
description: "Adoption of Next.js Navigation Module for Application Route Handling: Application Route Entrypoints Navigation Dependent View"
metadata:
  actual:
    adr_id: a5a01b31-ce29-4084-bcbb-71879f27e815
    status: accepted
    candidate_group_id: 773a65a9-728b-45f5-9e58-712632fa746d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of Next.js Navigation Module for Application Route Handling: Application Route Entrypoints Navigation Dependent View

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NAV-001** MUST: All application route entrypoints and navigation-dependent view components MUST use the Next.js navigation module for routing, route parameter access, and programmatic transitions.

### Verify

```bash
# Discover the project build configuration and run type verification
# Discover and run repository linter to verify routing import boundaries
```

**Accept when:**
- Static type verification passes without errors across all route entrypoints importing navigation primitives.
- Linter rules confirm that internal routing references use framework navigation rather than direct window location modifications.

<enforcement>
Claude Code MUST NOT skip or defer verification. Architectural exceptions require written rationale approved by the frontend engineering leads and documented in the repository decision logs.
</enforcement>