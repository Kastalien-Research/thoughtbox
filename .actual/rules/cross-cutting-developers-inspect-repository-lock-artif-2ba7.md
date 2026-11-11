---
version: 2
name: cross-cutting-developers-inspect-repository-lock-artif-2ba7
description: "Adoption of fs/promises for Asynchronous File System Operations: Developers Inspect Repository Lock Artifact Verify"
metadata:
  actual:
    adr_id: 2ba7e259-0f0a-4ace-a063-e915238ebb6d
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

# Adoption of fs/promises for Asynchronous File System Operations: Developers Inspect Repository Lock Artifact Verify

Scope: applies to `scripts/**`, `src/notebook/**`, `src/persistence/**`.

These rules are ALWAYS ACTIVE for all application persistence layers, state management services, execution harnesses, and operational scripts performing file system I/O (excluding in-memory caching and transient state stores that do not interact with persistent disk storage).

### Rules

- **R-FS-001** MUST: Developers MUST inspect the repository lock artifact to verify the runtime resolution of all underlying core module dependencies prior to implementing file system integrations.

### Verify

```bash
# Discover and execute the repository static analysis and linting scripts to verify that forbidden synchronous file system invocations are absent.
# Discover and execute the repository automated test suite to ensure that asynchronous persistence and file operations resolve cleanly.
```

**Accept when:**
- Static analysis checks pass with zero occurrences of prohibited synchronous file system calls in application and scripting code.
- All automated test suites exercising persistence and file storage components complete successfully.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration builds fail upon detection of prohibited synchronous file system calls, and pull requests containing disallowed file system access methods must be revised prior to merge approval.
</enforcement>