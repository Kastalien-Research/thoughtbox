---
version: 2
name: cross-cutting-child-process-subprocess-lifecycle-manag-11e3
description: "Adoption of node:child_process for Subprocess Lifecycle Management: Long Running Subprocess Invocations Enforce Execution"
metadata:
  actual:
    adr_id: 11e3ad23-186c-482d-8a18-3e51687d3ad9
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

# Adoption of node:child_process for Subprocess Lifecycle Management: Long Running Subprocess Invocations Enforce Execution

Scope: applies to `scripts/utils/**`, `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CP-001** MUST: Long-running subprocess invocations MUST enforce an execution timeout budget that terminates the child process and rejects with a timeout error upon expiration.

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