---
version: 2
name: cross-cutting-vm-isolated-dynamic-script-evaluation-9ff7
description: "Adoption of node:vm for Isolated Dynamic Script Evaluation: Code Inputs Evaluated Node Pre Validated"
metadata:
  actual:
    adr_id: 9ff7977d-a006-40c9-8ac6-41974f9861ce
    status: accepted
    candidate_group_id: 7d6e013f-5273-48a5-8cc8-0dd1de6ebde6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/code-mode/**
---

# Adoption of node:vm for Isolated Dynamic Script Evaluation: Code Inputs Evaluated Node Pre Validated

Scope: applies to `src/code-mode/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VM-001** MUST: All code inputs evaluated by node:vm MUST be pre-validated as syntactically well-formed strings conforming to input schemas prior to execution.

### Verify

```bash
# Discover and run repository validation scripts that verify dynamic script execution and sandboxed context boundaries
npm test -- --grep "vm|sandbox|isolation|timeout"
```

**Accept when:**
- All test suites evaluating dynamic code execution within virtual machine contexts pass without isolation or timeout regressions.
- Static analysis and test assertions confirm dynamic code strings are evaluated exclusively through virtual machine contexts without host process evaluation primitives.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration pipelines executing test suites and static analysis rules, and mandatory architectural/code review.
</enforcement>