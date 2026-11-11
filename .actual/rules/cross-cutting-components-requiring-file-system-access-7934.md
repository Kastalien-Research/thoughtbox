---
version: 2
name: cross-cutting-components-requiring-file-system-access-7934
description: "Adoption of fs/promises for Asynchronous File System Operations: Components Requiring File System Access Utilize"
metadata:
  actual:
    adr_id: 79348c5c-79c5-487f-a1b5-1eeb88257633
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

# Adoption of fs/promises for Asynchronous File System Operations: Components Requiring File System Access Utilize

Scope: applies to `scripts/**`, `src/notebook/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for all application persistence layers, state management services, execution harnesses, and operational scripts performing file system I/O.

### Rules

- **R-FS-001** MUST: Components requiring file system access MUST utilize the fs/promises module for all file and directory read, write, and inspection operations.

### Verify

```bash
# Discover and execute repository static analysis, linting, and automated test suites
# to verify that forbidden synchronous file system invocations are absent
# and asynchronous file operations resolve cleanly.
```

**Accept when:**
- Static analysis checks pass with zero occurrences of prohibited synchronous file system calls in application and scripting code.
- All automated test suites exercising persistence and file storage components complete successfully.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>