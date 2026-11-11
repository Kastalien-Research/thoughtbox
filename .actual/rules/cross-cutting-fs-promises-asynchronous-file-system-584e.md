---
version: 2
name: cross-cutting-fs-promises-asynchronous-file-system-584e
description: "Adoption of node:fs/promises for Asynchronous File System Operations: Developers Verify Runtime Environment Compatibility Availability"
metadata:
  actual:
    adr_id: 584eb6bc-e90d-40fb-8fa7-7eb449223348
    status: accepted
    candidate_group_id: b056b885-477f-4802-8e96-21d428e838ec
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Adoption of node:fs/promises for Asynchronous File System Operations: Developers Verify Runtime Environment Compatibility Availability

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for runtime configuration management, command-line interface hook dispatchers, and shared file access helper modules within CLI boundaries.

### Rules

- **R-FSP-001** MUST: Developers MUST verify runtime environment compatibility and API availability against the repository dependency manifest and lock artifacts before adopting new filesystem interfaces.

### Verify

```bash
# Discover and execute repository static analysis script
# Discover and execute repository test suite
```

**Accept when:**
- Static analysis validates that all filesystem imports utilize node:fs/promises with explicit protocol scheme prefixes.
- Automated test execution confirms that all filesystem interactions complete without unhandled promise rejections.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>