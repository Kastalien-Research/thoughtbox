---
version: 2
name: cross-cutting-fs-promises-asynchronous-file-system-19da
description: "Adoption of node:fs/promises for Asynchronous File System Operations: Core Module Import Declarations Include Protocol"
metadata:
  actual:
    adr_id: 19da73b1-7a79-44b4-ac40-5df52dddea53
    status: accepted
    candidate_group_id: b056b885-477f-4802-8e96-21d428e838ec
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Adoption of node:fs/promises for Asynchronous File System Operations: Core Module Import Declarations Include Protocol

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for runtime configuration management, persistence layers, command-line interface hook dispatchers, execution utilities, and shared file access helper modules within CLI boundaries.

### Rules

- **R-FS-001** MUST: Core module import declarations MUST include the protocol scheme prefix for explicit runtime module resolution.

### Verify

```bash
# Discover and execute the repository static analysis script
# Discover and execute the test execution script to confirm asynchronous operations complete without unhandled rejections
```

**Accept when:**
- Static analysis validates that all filesystem imports utilize node:fs/promises with explicit protocol scheme prefixes.
- Automated test execution confirms that all filesystem interactions complete without unhandled promise rejections.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>