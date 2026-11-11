---
version: 2
name: cross-cutting-vm-isolated-dynamic-script-evaluation-95a0
description: "Adoption of node:vm for Isolated Dynamic Script Evaluation: Results Shared State Produced Within Node"
metadata:
  actual:
    adr_id: 95a08cae-d7ee-46f8-b6e2-c47f871ff229
    status: accepted
    candidate_group_id: 7d6e013f-5273-48a5-8cc8-0dd1de6ebde6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/code-mode/**
---

# Adoption of node:vm for Isolated Dynamic Script Evaluation: Results Shared State Produced Within Node

Scope: applies to `src/code-mode/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NODEVM-001** SHOULD: Results and shared state produced within node:vm execution contexts SHOULD be serialized and parsed through structured interchange boundaries before integration into host memory stores.

### Verify

```bash
# Discover and run repository validation scripts that verify dynamic script execution and sandboxed context boundaries
npm test
```

**Accept when:**
- All test suites evaluating dynamic code execution within virtual machine contexts pass without isolation or timeout regressions.
- Static analysis and test assertions confirm dynamic code strings are evaluated exclusively through virtual machine contexts without host process evaluation primitives.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>