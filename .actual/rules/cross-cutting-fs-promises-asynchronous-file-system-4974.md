---
version: 2
name: cross-cutting-fs-promises-asynchronous-file-system-4974
description: "Adoption of node:fs/promises for Asynchronous File System Operations: Modules Performing Filesystem Operations Import Asynchronous"
metadata:
  actual:
    adr_id: 4974b3f0-6181-48cb-9c69-d66fd4d90555
    status: accepted
    candidate_group_id: b056b885-477f-4802-8e96-21d428e838ec
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Adoption of node:fs/promises for Asynchronous File System Operations: Modules Performing Filesystem Operations Import Asynchronous

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-FS-001** MUST: Modules performing filesystem I/O operations MUST import asynchronous APIs exclusively from node:fs/promises.

### Verify

```bash
# Discover and execute the repository static analysis script
# Example: npm run lint or equivalent discovered via package.json
$(npm run --silent lint || yarn --silent lint || pnpm --silent lint)

# Discover and execute the repository test suite
$(npm test || yarn test || pnpm test)
```

**Accept when:**
- Static analysis validates that all filesystem imports utilize node:fs/promises with explicit protocol scheme prefixes.
- Automated test execution confirms that all filesystem interactions complete without unhandled promise rejections.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration static analysis pipelines and peer code reviews validate import declarations and asynchronous error handling patterns.
</enforcement>