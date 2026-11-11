---
version: 2
name: cross-cutting-vm-isolated-dynamic-script-evaluation-c0bb
description: "Adoption of node:vm for Isolated Dynamic Script Evaluation: Virtual Machine Contexts Created Via Node"
metadata:
  actual:
    adr_id: c0bb8cfc-62b2-4869-b412-bd50fc141b5e
    status: accepted
    candidate_group_id: 7d6e013f-5273-48a5-8cc8-0dd1de6ebde6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/code-mode/**
---

# Adoption of node:vm for Isolated Dynamic Script Evaluation: Virtual Machine Contexts Created Via Node

Scope: applies to `src/code-mode/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VM-001** MUST: Virtual machine contexts created via node:vm MUST strictly define exposed globals, granting access only to explicitly required catalog structures or SDK boundaries.

### Verify

```bash
# Discover and run the repository validation scripts that verify dynamic script execution and sandboxed context boundaries.
# Execute the test suite verifying timeout enforcement and global isolation within dynamic execution tool modules.
```

**Accept when:**
- All test suites evaluating dynamic code execution within virtual machine contexts pass without isolation or timeout regressions.
- Static analysis and test assertions confirm dynamic code strings are evaluated exclusively through virtual machine contexts without host process evaluation primitives.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Direct invocation of host evaluation mechanisms outside virtual machine contexts blocks integration and triggers immediate remediation. Violation handling: Pull requests lacking timeout enforcement or pre-execution validation on dynamic scripts are rejected during review.
</enforcement>