---
version: 2
name: cross-cutting-vm-isolated-dynamic-script-evaluation-eba6
description: "Adoption of node:vm for Isolated Dynamic Script Evaluation: System Execute Dynamic User Submitted Code"
metadata:
  actual:
    adr_id: eba6249a-4ec1-4a8a-b24e-d4b9ee123dcb
    status: accepted
    candidate_group_id: 7d6e013f-5273-48a5-8cc8-0dd1de6ebde6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/code-mode/**
---

# Adoption of node:vm for Isolated Dynamic Script Evaluation: System Execute Dynamic User Submitted Code

Scope: applies to `src/code-mode/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VM-001** MUST: The system MUST execute all dynamic user-submitted code strings through node:vm contexts rather than direct host process evaluation mechanisms.

### Verify

```bash
# Discover and run repository validation scripts that verify dynamic script execution and sandboxed context boundaries
npm test
```

**Accept when:**
- All test suites evaluating dynamic code execution within virtual machine contexts pass without isolation or timeout regressions.
- Static analysis and test assertions confirm dynamic code strings are evaluated exclusively through virtual machine contexts without host process evaluation primitives.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Direct invocation of host evaluation mechanisms outside virtual machine contexts blocks integration and triggers immediate remediation. Pull requests lacking timeout enforcement or pre-execution validation on dynamic scripts are rejected during review.
</enforcement>