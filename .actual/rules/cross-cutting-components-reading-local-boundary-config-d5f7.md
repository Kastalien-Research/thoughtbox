---
version: 2
name: cross-cutting-components-reading-local-boundary-config-d5f7
description: "Node Core Runtime Service Definition via URLSearchParams and File System Promises: Components Reading Local Boundary Configuration Files"
metadata:
  actual:
    adr_id: d5f762b5-676d-4555-8970-4222e475edaf
    status: accepted
    candidate_group_id: 198555bc-f767-46e9-85f3-c718ac37fa95
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Node Core Runtime Service Definition via URLSearchParams and File System Promises: Components Reading Local Boundary Configuration Files

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for configuration modules responsible for resolving service endpoints and boundary parameters, and CLI configuration routines interacting with asynchronous local configuration files and URL parameters.

### Rules

- **R-ADR-001** MUST: Components reading local boundary configuration files MUST utilize core asynchronous filesystem promises and path resolution modules rather than synchronous filesystem blocking primitives.

### Verify

```bash
# Discover and run the unit test suite covering configuration boundary parsing
# Discover and run static analysis/linting to verify compliance of asynchronous filesystem calls and URL parameter handling
```

**Accept when:**
- All unit tests exercising configuration retrieval and URL parameter parsing execute and pass with zero failures.
- Static analysis checks pass without errors concerning unhandled promise rejections or unsafe deserialization.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>