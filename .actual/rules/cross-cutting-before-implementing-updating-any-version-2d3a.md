---
version: 2
name: cross-cutting-before-implementing-updating-any-version-2d3a
description: "Persistence Core Module Adoption: Before Implementing Updating Any Versioned Module"
metadata:
  actual:
    adr_id: 2d3aaaac-d491-4423-af1b-ecdf2ad1b8f3
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

# Persistence Core Module Adoption: Before Implementing Updating Any Versioned Module

Scope: applies to `src/references/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all domain services, session handlers, query abstractions, and reference resolvers performing state persistence or retrieval.

### Rules

- **R-PCM-001** MUST: Before implementing or updating any versioned module or dependency supporting persistence operations, developers MUST inspect the repository lock artifact to verify and ground against the exact resolved dependency version.
- **R-PCM-002** MUST: Execute in order for version-grounding: find the dependency manifest, identify the build tool, inspect the repository lock or resolution artifact for the exact resolved version, look up official documentation for that exact version, confirm every API/class/function exists in that version, and re-run steps per dependency at point of use for version-sensitive behavior.
- **R-PCM-003** MUST: Encapsulate complex state queries inside domain query objects that interact with the persistence module rather than inlining query logic into session handlers.
- **R-PCM-004** MUST: Ensure caching structures such as resolution caches or anchor lookups invalidate properly upon state mutation through the persistence boundary.

### Verify

```bash
# Discover the repository test runner from the project manifest and execute the test suite covering domain handlers and persistence integration.
# Discover the repository static analysis linter and run import boundary checks to ensure domain handlers import persistence exclusively through the designated module contract.
```

**Accept when:**
- All session handling and reference resolution test suites pass against the centralized persistence module boundary.
- Static analysis confirms no domain modules execute unmediated datastore queries bypassing the persistence module interface.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated linting, module boundary checks, architecture review, and code reviews enforce these requirements.
</enforcement>