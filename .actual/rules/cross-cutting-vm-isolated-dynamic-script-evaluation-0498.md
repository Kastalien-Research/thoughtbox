---
version: 2
name: cross-cutting-vm-isolated-dynamic-script-evaluation-0498
description: "Adoption of node:vm for Isolated Dynamic Script Evaluation: Execution Scripts Node Enforce Termination Constraints"
metadata:
  actual:
    adr_id: 0498f91e-fa6e-4ffd-beae-dd2e1a9d21ef
    status: accepted
    candidate_group_id: 7d6e013f-5273-48a5-8cc8-0dd1de6ebde6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/code-mode/**
---

# Adoption of node:vm for Isolated Dynamic Script Evaluation: Execution Scripts Node Enforce Termination Constraints

Scope: applies to `src/code-mode/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VM-001** MUST: Execution of scripts in node:vm MUST enforce termination constraints, including timeouts, to prevent unbounded asynchronous operations or execution deadlocks.

### Verify

```bash
# Discover and run the repository validation scripts that verify dynamic script execution and sandboxed context boundaries.
# Execute the test suite verifying timeout enforcement and global isolation within dynamic execution tool modules.
```

**Accept when:**
- All test suites evaluating dynamic code execution within virtual machine contexts pass without isolation or timeout regressions.
- Static analysis and test assertions confirm dynamic code strings are evaluated exclusively through virtual machine contexts without host process evaluation primitives.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>