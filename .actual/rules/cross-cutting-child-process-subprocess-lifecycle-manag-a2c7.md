---
version: 2
name: cross-cutting-child-process-subprocess-lifecycle-manag-a2c7
description: "Adoption of node:child_process for Subprocess Lifecycle Management: Output Parsing Process Standard Streams Validate"
metadata:
  actual:
    adr_id: a2c7831e-c3bd-4851-9e3d-ed0a46b374d0
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

# Adoption of node:child_process for Subprocess Lifecycle Management: Output Parsing Process Standard Streams Validate

Scope: applies to `scripts/utils/**`, `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for execution of out-of-process peer runtime tasks, notebook evaluations, and operational utility scripts executing external system commands and task handoffs.

### Rules

- **R-CP-001** SHOULD: Output parsing of process standard output streams SHOULD validate structured payloads using defensive parsing safeguards before returning execution results.

### Verify

```bash
# Discover and run static type checking across runtime provider and utility modules from repository configuration
# Discover and execute test suites covering process runtime providers, timeout enforcement, and cancellation handling
# Execute repository linting tools to verify module import conventions
```

**Accept when:**
- All subprocess invocations register lifecycle event handlers for standard output, standard error, error, and close events.
- Process timeout and cancellation test suites pass without hanging processes or orphaned background executions.
- Stream capture limits and diagnostic error propagation conform to repository safety boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification. Code changes introducing unsupervised child process spawning or missing error handlers are blocked during review. Runtime failures caused by unhandled child process streams or orphaned processes are classified as high-priority defects.
</enforcement>