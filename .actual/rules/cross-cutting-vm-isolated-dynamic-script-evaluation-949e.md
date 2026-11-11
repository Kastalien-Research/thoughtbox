---
version: 2
name: cross-cutting-vm-isolated-dynamic-script-evaluation-949e
description: "Adoption of node:vm for Isolated Dynamic Script Evaluation: Components Executing Dynamic Scripts Not Expose"
metadata:
  actual:
    adr_id: 949e9ac3-b936-4f8c-9fbf-b75028f53e4d
    status: accepted
    candidate_group_id: 7d6e013f-5273-48a5-8cc8-0dd1de6ebde6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/code-mode/**
---

# Adoption of node:vm for Isolated Dynamic Script Evaluation: Components Executing Dynamic Scripts Not Expose

Scope: applies to `src/code-mode/**`.

These rules are ALWAYS ACTIVE for components executing dynamic scripts, query functions, and user-provided script strings within tool invocation workflows and runtime modules.

### Rules

- **R-VM-001** MUST_NOT: Components executing dynamic scripts MUST NOT expose the host process environment, unrestricted global objects, or unauthorized internal modules to the virtual machine context.

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