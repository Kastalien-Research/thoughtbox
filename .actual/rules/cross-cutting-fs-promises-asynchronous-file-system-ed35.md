---
version: 2
name: cross-cutting-fs-promises-asynchronous-file-system-ed35
description: "Adoption of node:fs/promises for Asynchronous File System Operations: Asynchronous Filesystem Operations Handled Async Await"
metadata:
  actual:
    adr_id: ed3530e1-c896-4400-aae5-165fffea43a0
    status: accepted
    candidate_group_id: b056b885-477f-4802-8e96-21d428e838ec
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Adoption of node:fs/promises for Asynchronous File System Operations: Asynchronous Filesystem Operations Handled Async Await

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for runtime configuration management, persistence layers, command-line interface hook dispatchers, execution utilities, and shared file access helper modules within CLI boundaries.

### Rules

- **R-FS-001** MUST: All asynchronous filesystem operations MUST be handled using async/await syntax and enclosed within structured error handling blocks.

### Verify

```bash
# Discover and execute the repository static analysis script to verify compliance with core module import rules
# Discover and execute the repository test execution script to run the test suite
```

**Accept when:**
- Static analysis validates that all filesystem imports utilize node:fs/promises with explicit protocol scheme prefixes.
- Automated test execution confirms that all filesystem interactions complete without unhandled promise rejections.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration static analysis pipelines and peer code reviews validate import declarations and asynchronous error handling patterns.
</enforcement>