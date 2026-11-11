---
version: 2
name: cross-cutting-subprocess-invocations-register-event-li-7cd4
description: "child_process Module for Subprocess Execution and Lifecycle Management: Subprocess Invocations Register Event Listeners Process"
metadata:
  actual:
    adr_id: 7cd41440-e22b-4e20-ab25-b70a8431ab85
    status: accepted
    candidate_group_id: 75e6113e-8ffa-4a22-b999-827147b5eec5
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/agents/**
      - scripts/utils/**
      - src/notebook/**
---

# child_process Module for Subprocess Execution and Lifecycle Management: Subprocess Invocations Register Event Listeners Process

Scope: applies to `scripts/agents/**`, `scripts/utils/**`, `src/notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CP-001** MUST: Subprocess invocations MUST register event listeners for process exit, close, and error events to guarantee deterministic resolution of execution state.

### Verify

```bash
# Discover and execute the project test runner across process execution and notebook execution test suites.
# Discover and run static type checking and linting scripts to verify compliance with child_process event handling patterns.
```

**Accept when:**
- All process execution test suites pass, verifying asynchronous stream buffering, timeout handling, and deterministic exit state resolution.
- Static analysis verification reports zero unhandled child process error events or unmonitored process spawns across the codebase.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>