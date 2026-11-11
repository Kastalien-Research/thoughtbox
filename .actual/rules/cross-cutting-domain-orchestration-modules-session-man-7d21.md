---
version: 2
name: cross-cutting-domain-orchestration-modules-session-man-7d21
description: "Persistence Core Module Adoption: Domain Orchestration Modules Session Management Services"
metadata:
  actual:
    adr_id: 7d21f4e6-e2e8-45d1-bf8f-791d66dd0d33
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

# Persistence Core Module Adoption: Domain Orchestration Modules Session Management Services

Scope: applies to `src/references/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-PERSIST-001** MUST: Domain orchestration modules, session management services, and reference resolution components MUST route all persistent state retrieval, updates, and storage queries through the internal persistence module boundary.

### Verify

```bash
# Discover the repository test runner from the project manifest and execute the test suite covering domain handlers and persistence integration.
# Discover the repository static analysis linter and run import boundary checks to ensure domain handlers import persistence exclusively through the designated module contract.
```

**Accept when:**
- All session handling and reference resolution test suites pass against the centralized persistence module boundary.
- Static analysis confirms no domain modules execute unmediated datastore queries bypassing the persistence module interface.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>