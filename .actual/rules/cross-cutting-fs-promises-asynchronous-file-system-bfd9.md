---
version: 2
name: cross-cutting-fs-promises-asynchronous-file-system-bfd9
description: "Adoption of node:fs/promises for Asynchronous File System Operations: Deserialization Filesystem Read Payloads Validate Input"
metadata:
  actual:
    adr_id: bfd9ccac-d236-42e6-835f-2530f6f9bae2
    status: accepted
    candidate_group_id: b056b885-477f-4802-8e96-21d428e838ec
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Adoption of node:fs/promises for Asynchronous File System Operations: Deserialization Filesystem Read Payloads Validate Input

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for runtime configuration management, command-line interface hook dispatchers, and shared file access helper modules within CLI boundaries.

### Rules

- **R-FS-001** SHOULD: Deserialization of filesystem read payloads SHOULD validate input schemas and handle parsing errors without unhandled terminations.

### Verify

```bash
# Discover and execute the repository static analysis script
# Discover and execute the repository test execution script
```

**Accept when:**
- Static analysis validates that all filesystem imports utilize node:fs/promises with explicit protocol scheme prefixes.
- Automated test execution confirms that all filesystem interactions complete without unhandled promise rejections.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>