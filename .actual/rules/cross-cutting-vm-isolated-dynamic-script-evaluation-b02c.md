---
version: 2
name: cross-cutting-vm-isolated-dynamic-script-evaluation-b02c
description: "Adoption of node:vm for Isolated Dynamic Script Evaluation: Developers Verify Runtime Environment Engine Compatibility"
metadata:
  actual:
    adr_id: b02cfe42-2a7b-4ecc-84c1-11a25fe451cd
    status: accepted
    candidate_group_id: 7d6e013f-5273-48a5-8cc8-0dd1de6ebde6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/code-mode/**
---

# Adoption of node:vm for Isolated Dynamic Script Evaluation: Developers Verify Runtime Environment Engine Compatibility

Scope: applies to `src/code-mode/**`.

These rules are ALWAYS ACTIVE for all dynamic tool components, catalog item filtering, and service SDK function invocation workflows utilizing string evaluation.

### Rules

- **R-VM-001** MUST: Developers MUST verify runtime environment engine compatibility and lock definitions in the project resolution artifact prior to invoking virtual machine execution APIs.

### Verify

```bash
# Discover and run repository validation scripts verifying dynamic script execution and sandboxed context boundaries
npm test -- --grep "vm|sandbox|isolation|timeout"
```

**Accept when:**
- All test suites evaluating dynamic code execution within virtual machine contexts pass without isolation or timeout regressions.
- Static analysis and test assertions confirm dynamic code strings are evaluated exclusively through virtual machine contexts without host process evaluation primitives.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Direct invocation of host evaluation mechanisms outside virtual machine contexts blocks integration and triggers immediate remediation.
</enforcement>