---
version: 2
name: cross-cutting-subprocess-execution-across-runtimes-aut-8bb1
description: "child_process Module for Subprocess Execution and Lifecycle Management: Subprocess Execution Across Runtimes Automation Scripts"
metadata:
  actual:
    adr_id: 8bb175e4-655f-4c1d-9d8f-7c11b66a436a
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

# child_process Module for Subprocess Execution and Lifecycle Management: Subprocess Execution Across Runtimes Automation Scripts

Scope: applies to `scripts/agents/**`, `scripts/utils/**`, `src/notebook/**`.

These rules are ALWAYS ACTIVE for all application modules, notebook execution runtimes, and scripting utilities that execute child processes or shell commands.

### Rules

- **R-SUB-001** MUST: Subprocess execution across execution runtimes and automation scripts MUST use the child_process module and adhere to an asynchronous event-driven lifecycle pattern capturing standard output, standard error, exit status, and errors.

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