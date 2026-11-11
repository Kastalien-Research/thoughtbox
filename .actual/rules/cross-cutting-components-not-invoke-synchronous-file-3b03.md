---
version: 2
name: cross-cutting-components-not-invoke-synchronous-file-3b03
description: "Adoption of fs/promises for Asynchronous File System Operations: Components Not Invoke Synchronous File System"
metadata:
  actual:
    adr_id: 3b03c5e7-be59-4724-908e-981102e42163
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

# Adoption of fs/promises for Asynchronous File System Operations: Components Not Invoke Synchronous File System

Scope: applies to `scripts/**`, `src/notebook/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for all application persistence layers, state management services, execution harnesses, and operational scripts performing file system I/O.

### Rules

- **R-FS-001** MUST_NOT: Components MUST NOT invoke synchronous file system methods or legacy callback-based interfaces within asynchronous execution pipelines or storage services.

### Verify

```bash
# Discover and execute the repository static analysis and linting scripts
# Discover and execute the repository automated test suite
```

**Accept when:**
- Static analysis checks pass with zero occurrences of prohibited synchronous file system calls in application and scripting code.
- All automated test suites exercising persistence and file storage components complete successfully.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated static analysis checks and peer code reviews.
</enforcement>