---
version: 2
name: cross-cutting-file-system-operations-coordinate-normal-3ac5
description: "Adoption of fs/promises for Asynchronous File System Operations: File System Operations Coordinate Normalized Path"
metadata:
  actual:
    adr_id: 3ac59bb7-cd5f-4ca5-aeaa-7023b21ac17b
    status: accepted
    candidate_group_id: 90329620-fa5b-4de5-9505-1d91bfe99efa
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/notebook/**
      - src/persistence/**
---

# Adoption of fs/promises for Asynchronous File System Operations: File System Operations Coordinate Normalized Path

Scope: applies to `scripts/**`, `src/notebook/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for all application persistence layers, state management services, execution harnesses, and operational scripts performing file system I/O.

### Rules

- **R-FS-001** SHOULD: File system operations SHOULD coordinate with normalized path resolution utilities to maintain cross-platform path handling consistency.

### Verify

```bash
# Discover and execute repository static analysis, linting, and test suites to verify asynchronous file system patterns
```

**Accept when:**
- Static analysis checks pass with zero occurrences of prohibited synchronous file system calls in application and scripting code.
- All automated test suites exercising persistence and file storage components complete successfully.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via static analysis and automated tests in the CI pipeline.
</enforcement>