---
version: 2
name: cross-cutting-child-process-subprocess-lifecycle-manag-ca12
description: "Adoption of node:child_process for Subprocess Lifecycle Management: Child Process Handlers Not Leave Termination"
metadata:
  actual:
    adr_id: ca12828d-147b-4c81-b8cd-db6115691955
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

# Adoption of node:child_process for Subprocess Lifecycle Management: Child Process Handlers Not Leave Termination

Scope: applies to `scripts/utils/**`, `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for execution of out-of-process peer runtime tasks, notebook evaluations, and operational utility scripts executing external system commands and task handoffs.

### Rules

- **R-CP-001** MUST_NOT: Child process handlers MUST_NOT leave process termination signals or non-zero exit codes unhandled, and MUST propagate captured diagnostic error streams upon failure.

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