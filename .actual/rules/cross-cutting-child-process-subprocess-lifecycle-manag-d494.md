---
version: 2
name: cross-cutting-child-process-subprocess-lifecycle-manag-d494
description: "Adoption of node:child_process for Subprocess Lifecycle Management: Subprocess Execution Providers Maintain Active Process"
metadata:
  actual:
    adr_id: d494d451-44ca-4381-b2fa-f5d49afd74e1
    status: accepted
    candidate_group_id: ad78a3d2-11f1-4e04-b444-c836788d2afd
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/utils/**
      - src/peer-notebook/**
---

# Adoption of node:child_process for Subprocess Lifecycle Management: Subprocess Execution Providers Maintain Active Process

Scope: applies to `scripts/utils/**`, `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CP-001** MUST: Subprocess execution providers MUST maintain an active process registry mapping unique invocation identifiers to active child instances and cancellation handlers to prevent orphaned executions.

### Verify

```bash
# Discover and run static type checking across runtime provider and utility modules from the repository configuration.
# Discover and execute test suites covering process runtime providers, timeout enforcement, and cancellation handling.
# Execute repository linting tools to verify module import conventions.
```

**Accept when:**
- All subprocess invocations register lifecycle event handlers for standard output, standard error, error, and close events.
- Process timeout and cancellation test suites pass without hanging processes or orphaned background executions.
- Stream capture limits and diagnostic error propagation conform to repository safety boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>