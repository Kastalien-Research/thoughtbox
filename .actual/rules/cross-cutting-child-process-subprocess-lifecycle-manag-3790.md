---
version: 2
name: cross-cutting-child-process-subprocess-lifecycle-manag-3790
description: "Adoption of node:child_process for Subprocess Lifecycle Management: Every Spawned Subprocess Register Event Listeners"
metadata:
  actual:
    adr_id: 37906762-dc59-4ab7-a5e6-8deea85903cb
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

# Adoption of node:child_process for Subprocess Lifecycle Management: Every Spawned Subprocess Register Event Listeners

Scope: applies to `scripts/utils/**`, `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for execution of out-of-process peer runtime tasks, notebook evaluations, and operational utility scripts executing external system commands and task handoffs.

### Rules

- **R-CP-001** MUST: Every spawned subprocess MUST register event listeners for stdout, stderr, error, and close events to ensure complete stream consumption and process lifecycle tracking.

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