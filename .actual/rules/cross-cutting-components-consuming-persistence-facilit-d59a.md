---
version: 2
name: cross-cutting-components-consuming-persistence-facilit-d59a
description: "Persistence Core Module Adoption: Components Consuming Persistence Facilities Isolate Query"
metadata:
  actual:
    adr_id: d59a266e-d1ac-4495-a490-8eb3be23ac2f
    status: accepted
    candidate_group_id: 05fe97e4-aac0-4400-bf57-9e0e81934dc9
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/references/**
      - src/sessions/**
---

# Persistence Core Module Adoption: Components Consuming Persistence Facilities Isolate Query

Scope: applies to `src/references/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-PERSIST-001** SHOULD: Components consuming persistence facilities isolate query construction within dedicated query abstractions rather than embedding storage access routines directly inside event or request handlers.

### Verify

```bash
# Discover the repository test runner from the project manifest and execute the test suite covering domain handlers and persistence integration.
# Discover the repository static analysis linter and run import boundary checks to ensure domain handlers import persistence exclusively through the designated module contract.
```

**Accept when:**
- All session handling and reference resolution test suites pass against the centralized persistence module boundary.
- Static analysis confirms no domain modules execute unmediated datastore queries bypassing the persistence module interface.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated linting, module boundary checks, and code reviews enforce these requirements, and violations fail continuous integration checks.
</enforcement>