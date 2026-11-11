---
version: 2
name: cross-cutting-applications-automation-scripts-capturin-47b9
description: "Console API Error Logging via console.error: Applications Automation Scripts Capturing Unhandled Failures"
metadata:
  actual:
    adr_id: 47b90b5d-985c-4c3d-86c7-7c4dd8fc9913
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

# Console API Error Logging via console.error: Applications Automation Scripts Capturing Unhandled Failures

Scope: applies to `apps/web/scripts/qa/**`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for application route handlers, server actions, error boundary components, and automation scripts emitting diagnostic failure records.

### Rules

- **R-CON-001** MUST: Applications and automation scripts capturing unhandled failures or diagnostic events MUST emit failure details using console.error when no centralized logging abstraction has been adopted.

### Verify

```bash
# Discover the repository static analysis and verification commands from the project configuration manifest and execute them across the codebase
# Discover and run the project test suites from the root configuration to verify that error handling pathways execute as expected
```

**Accept when:**
- All error handling pathways execute without unhandled rejections and emit diagnostic failure records to standard error streams.
- Static analysis and repository verification suites pass with zero unhandled diagnostics or syntax violations.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests omitting error logging in critical failure handlers or logging sensitive information will be blocked during code review.
</enforcement>