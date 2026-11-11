---
version: 2
name: cross-cutting-calling-handlers-supply-validated-worksp-f8f7
description: "Evidence Generator Module Adoption: Calling Handlers Supply Validated Workspace Session"
metadata:
  actual:
    adr_id: f8f70709-825e-4ed4-95c3-64f7b83b38c2
    status: accepted
    candidate_group_id: 032c6665-47d9-40fe-972a-7085ddf511ec
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge/**
---

# Evidence Generator Module Adoption: Calling Handlers Supply Validated Workspace Session

Scope: applies to `src/merge/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EVD-001** SHOULD: Calling handlers SHOULD supply validated workspace and session context when requesting evidence generation to maintain traceable audit records.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>