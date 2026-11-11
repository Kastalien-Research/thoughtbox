---
version: 2
name: cross-cutting-fs-promises-asynchronous-file-system-05b0
description: "Adoption of node:fs/promises for Asynchronous File System Operations: Modules Not Invoke Synchronous Blocking Filesystem"
metadata:
  actual:
    adr_id: 05b0ed22-1dfe-44e3-bf5f-712422a3ddc5
    status: accepted
    candidate_group_id: b056b885-477f-4802-8e96-21d428e838ec
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Adoption of node:fs/promises for Asynchronous File System Operations: Modules Not Invoke Synchronous Blocking Filesystem

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-FS-001** MUST_NOT: Modules MUST NOT invoke synchronous blocking filesystem methods or legacy callback interfaces within runtime execution paths.

### Verify

```bash
# Discover and execute the repository static analysis script
# Discover and execute the repository test execution script
```

**Accept when:**
- Static analysis validates that all filesystem imports utilize node:fs/promises with explicit protocol scheme prefixes.
- Automated test execution confirms that all filesystem interactions complete without unhandled promise rejections.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>