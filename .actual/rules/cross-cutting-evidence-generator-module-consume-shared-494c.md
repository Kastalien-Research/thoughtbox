---
version: 2
name: cross-cutting-evidence-generator-module-consume-shared-494c
description: "Evidence Generator Module Adoption: Evidence Generator Module Consume Shared Domain"
metadata:
  actual:
    adr_id: 494ce2fa-4757-42c2-b8fb-60d49ec09845
    status: accepted
    candidate_group_id: 032c6665-47d9-40fe-972a-7085ddf511ec
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge/**
---

# Evidence Generator Module Adoption: Evidence Generator Module Consume Shared Domain

Scope: applies to `src/merge/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EVD-001** MUST: The evidence-generator module MUST consume shared domain type contracts to ensure consistent schema representation across all evidence consumers.

### Verify

```bash
# Discover and execute the project test suite covering merge handlers and evidence generation to verify integration correctness.
# Discover and execute the repository static analysis and type checking suite to verify contract compliance between handlers and the evidence module.
# Discover and execute the repository module boundary linting or dependency validation checks to ensure no inline evidence generation exists.
```

**Accept when:**
- All merge handler and tool handler test suites pass with evidence generated via the shared evidence module.
- Static type checking confirms all evidence records adhere to domain type definitions without type assertions.
- Code analysis verifies no direct evidence formatting or synthesis occurs outside the evidence module.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>