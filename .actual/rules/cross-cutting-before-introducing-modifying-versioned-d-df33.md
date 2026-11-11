---
version: 2
name: cross-cutting-before-introducing-modifying-versioned-d-df33
description: "Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Before Introducing Modifying Versioned Dependencies Supporting"
metadata:
  actual:
    adr_id: df33f446-1c66-4064-8ba7-63e98ea91c56
    status: accepted
    candidate_group_id: fa0345b7-c311-4530-bded-e2c530f35a17
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
      - src/sessions/**
      - src/thought/**
---

# Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Before Introducing Modifying Versioned Dependencies Supporting

Scope: applies to `src/protocol/**`, `src/sessions/**`, `src/thought/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-THOUGHT-001** MUST: Before introducing or modifying versioned dependencies supporting the core thought handling infrastructure, the consumer MUST inspect the repository resolution artifact to resolve and verify the exact locked version against official documentation.

### Verify

```bash
# Discover and run the project's static analysis and module dependency boundary linter to verify dependency compliance and module boundaries
# Discover and execute the automated test suite covering session restoration and protocol tool operations
```

**Accept when:**
- Module boundary analysis confirms zero direct thought datastore mutations outside of the internal thought-handler module.
- All unit, integration, and protocol compliance tests pass with full schema validation and structured error handling verified.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>