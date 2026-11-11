---
version: 2
name: cross-cutting-before-introducing-versioned-external-lo-570d
description: "Console API Error Logging via console.error: Before Introducing Versioned External Logging Libraries"
metadata:
  actual:
    adr_id: 570d9c94-f28d-4db5-9d28-89f74460a951
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

# Console API Error Logging via console.error: Before Introducing Versioned External Logging Libraries

Scope: applies to `apps/web/scripts/qa/**`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for application route handlers, server actions, error boundary components, and automation scripts emitting diagnostic failure records.

### Rules

- **R-LOG-001** MUST: Before introducing versioned external logging libraries to replace direct console invocations, the consumer MUST inspect the repository dependency manifest and lock artifact to determine resolved logging capabilities and ecosystem constraints.
- **R-LOG-002** MUST: Follow the DISCOVERY POLICY and LOCK-VERSION GROUNDING guidelines before writing code that uses a versioned library, deriving tools, manifests, and resolved versions directly from the project repository.
- **R-LOG-003** MUST: Provide descriptive contextual strings as the leading argument to console.error to ensure clear identification of the failing operation.
- **R-LOG-004** MUST: Pass error instances as distinct parameters rather than string-concatenating them to preserve stack trace formatting across runtime environments.
- **R-LOG-005** MUST: Ensure error logging statements omit secrets and sanitize contextual metadata prior to invocation.

### Verify

```bash
# Discover the repository static analysis and verification commands from the project configuration manifest and execute them across the codebase
# Discover and run the project test suites from the root configuration to verify that error handling pathways execute as expected
```

**Accept when:**
- All error handling pathways execute without unhandled rejections and emit diagnostic failure records to standard error streams.
- Static analysis and repository verification suites pass with zero unhandled diagnostics or syntax violations.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification by automated continuous integration checks executing repository lint and verification directives is mandatory.
</enforcement>