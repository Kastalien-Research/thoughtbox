---
version: 2
name: cross-cutting-asynchronous-file-system-promises-includ-f767
description: "Adoption of fs/promises for Asynchronous File System Operations: Asynchronous File System Promises Include Structured"
metadata:
  actual:
    adr_id: f7671158-20b2-4ae3-a6be-98ad3220688c
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

# Adoption of fs/promises for Asynchronous File System Operations: Asynchronous File System Promises Include Structured

Scope: applies to `scripts/**`, `src/notebook/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-FS-001** MUST: All asynchronous file system promises MUST include structured error handling to capture operational failures and preserve execution context.

### Verify

```bash
# Discover and execute the repository static analysis and linting scripts to verify that forbidden synchronous file system invocations are absent.
# Discover and execute the repository automated test suite to ensure that asynchronous persistence and file operations resolve cleanly.
```

**Accept when:**
- Static analysis checks pass with zero occurrences of prohibited synchronous file system calls in application and scripting code.
- All automated test suites exercising persistence and file storage components complete successfully.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>