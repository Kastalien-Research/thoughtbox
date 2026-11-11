---
version: 2
name: cross-cutting-domain-handlers-query-services-not-38e8
description: "Persistence Core Module Adoption: Domain Handlers Query Services Not Implement"
metadata:
  actual:
    adr_id: 38e8ba19-6ce5-4015-8f7d-eef7354fe984
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

# Persistence Core Module Adoption: Domain Handlers Query Services Not Implement

Scope: applies to `src/references/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all domain services, session handlers, query abstractions, and reference resolvers performing state persistence or retrieval.

### Rules

- **R-PERSIST-001** MUST_NOT: Domain handlers and query services MUST NOT implement direct storage engine queries or access raw persistence backends bypassing the persistence module.

### Verify

\`\`\`bash
# Discover the repository test runner from the project manifest and execute the test suite covering domain handlers and persistence integration.
# Discover the repository static analysis linter and run import boundary checks to ensure domain handlers import persistence exclusively through the designated module contract.
\`\`\`

**Accept when:**
- All session handling and reference resolution test suites pass against the centralized persistence module boundary.
- Static analysis confirms no domain modules execute unmediated datastore queries bypassing the persistence module interface.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated linting, module boundary checks executed during continuous integration, and architecture/code reviews.
</enforcement>