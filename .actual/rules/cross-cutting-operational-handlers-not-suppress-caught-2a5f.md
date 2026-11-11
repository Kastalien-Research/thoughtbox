---
version: 2
name: cross-cutting-operational-handlers-not-suppress-caught-2a5f
description: "Console API Error Logging via console.error: Operational Handlers Not Suppress Caught Exceptions"
metadata:
  actual:
    adr_id: 2a5f2243-7c0a-4bb6-99d1-cdf9a3082841
    status: accepted
    candidate_group_id: 84762ff2-9bcf-4366-b135-821dbdf9bea6
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - scripts/qa/**
      - src/app/**
---

# Console API Error Logging via console.error: Operational Handlers Not Suppress Caught Exceptions

Scope: applies to `apps/web/scripts/qa/**`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for application route handlers, server actions, error boundary components, and automation scripts emitting diagnostic failure records.

### Rules

- **R-OPR-001** SHOULD_NOT: Operational handlers SHOULD_NOT suppress caught exceptions without emitting diagnostic information to console.error or an approved telemetry handler.
- **R-OPR-002** MANDATORY: Provide descriptive contextual strings as the leading argument to console.error to ensure clear identification of the failing operation.
- **R-OPR-003** MANDATORY: Pass error instances as distinct parameters rather than string-concatenating them to preserve stack trace formatting across runtime environments.

### Verify

```bash
# Discover the repository static analysis and verification commands from the project configuration manifest and execute them across the codebase
# Discover and run the project test suites from the root configuration to verify that error handling pathways execute as expected
```

**Accept when:**
- All error handling pathways execute without unhandled rejections and emit diagnostic failure records to standard error streams.
- Static analysis and repository verification suites pass with zero unhandled diagnostics or syntax violations.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks execute repository lint and verification directives.
</enforcement>