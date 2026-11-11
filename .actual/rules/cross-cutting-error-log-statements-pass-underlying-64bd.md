---
version: 2
name: cross-cutting-error-log-statements-pass-underlying-64bd
description: "Console API Error Logging via console.error: Error Log Statements Pass Underlying Object"
metadata:
  actual:
    adr_id: 64bdde2b-5707-4dd2-b6cc-c7348943da42
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

# Console API Error Logging via console.error: Error Log Statements Pass Underlying Object

Scope: applies to `apps/web/scripts/qa/**`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for application route handlers, server actions, error boundary components, and automation scripts emitting diagnostic failure records.

### Rules

- **R-ERR-001** MUST: Error log statements MUST pass the underlying error object or contextual descriptor alongside diagnostic messages to preserve error stack traces in standard error streams.

### Verify

```bash
# Discover the repository static analysis and verification commands from the project configuration manifest and execute them across the codebase
# Discover and run the project test suites from the root configuration to verify that error handling pathways execute as expected
```

**Accept when:**
- All error handling pathways execute without unhandled rejections and emit diagnostic failure records to standard error streams.
- Static analysis and repository verification suites pass with zero unhandled diagnostics or syntax violations.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks executing repository lint and verification directives, and by peer code review.
</enforcement>