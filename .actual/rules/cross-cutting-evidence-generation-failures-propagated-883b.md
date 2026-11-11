---
version: 2
name: cross-cutting-evidence-generation-failures-propagated-883b
description: "Evidence Generator Module Adoption: Evidence Generation Failures Propagated Explicit Domain"
metadata:
  actual:
    adr_id: 883b6fbc-4f30-4db2-ab9c-06b87fbb68b1
    status: accepted
    candidate_group_id: 032c6665-47d9-40fe-972a-7085ddf511ec
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge/**
---

# Evidence Generator Module Adoption: Evidence Generation Failures Propagated Explicit Domain

Scope: applies to `src/merge/**`.

These rules are ALWAYS ACTIVE for all merge workflow handlers, merge tool handlers, and merge coordination modules requiring audit or evidence artifact generation.

### Rules

- **R-EVD-001** SHOULD: Evidence generation failures SHOULD be propagated as explicit domain errors rather than silently suppressed.

### Verify

```bash
# Discover and execute the project test suite covering merge handlers and evidence generation
# Discover and execute the repository static analysis and type checking suite
# Discover and execute the repository module boundary linting or dependency validation checks
```

**Accept when:**
- All merge handler and tool handler test suites pass with evidence generated via the shared evidence module.
- Static type checking confirms all evidence records adhere to domain type definitions without type assertions.
- Code analysis verifies no direct evidence formatting or synthesis occurs outside the evidence module.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>