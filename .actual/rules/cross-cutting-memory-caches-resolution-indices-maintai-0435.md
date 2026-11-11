---
version: 2
name: cross-cutting-memory-caches-resolution-indices-maintai-0435
description: "Persistence Core Module Adoption: Memory Caches Resolution Indices Maintained Domain"
metadata:
  actual:
    adr_id: 0435d0e1-5eb5-456b-8eea-1b1acc03e708
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

# Persistence Core Module Adoption: Memory Caches Resolution Indices Maintained Domain

Scope: applies to `src/references/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all domain services, session handlers, query abstractions, and reference resolvers performing state persistence or retrieval.

### Rules

- **R-PERSIST-001** SHOULD: In-memory caches and resolution indices maintained by domain handlers or reference resolvers synchronize with state representations obtained from the persistence module.

### Verify

```bash
# Discover the repository test runner from the project manifest and execute the test suite covering domain handlers and persistence integration.
# Discover the repository static analysis linter and run import boundary checks to ensure domain handlers import persistence exclusively through the designated module contract.
```

**Accept when:**
- All session handling and reference resolution test suites pass against the centralized persistence module boundary.
- Static analysis confirms no domain modules execute unmediated datastore queries bypassing the persistence module interface.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated linting, module boundary checks, architecture review, and code reviews.
</enforcement>