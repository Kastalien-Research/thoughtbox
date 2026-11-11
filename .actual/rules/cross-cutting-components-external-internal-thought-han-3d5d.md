---
version: 2
name: cross-cutting-components-external-internal-thought-han-3d5d
description: "Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Components External Internal Thought Handler Module"
metadata:
  actual:
    adr_id: 3d5dec45-477d-4c55-a595-84721028b4fa
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

# Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Components External Internal Thought Handler Module

Scope: applies to `src/protocol/**`, `src/sessions/**`, `src/thought/**`.

These rules are ALWAYS ACTIVE for all protocol tool handlers, operational controllers, session restoration handlers, and query controllers that manage cognitive operations, reasoning workflows, or plan execution.

### Rules

- **R-TH-001** MUST_NOT: Components external to the internal thought-handler module MUST NOT implement duplicate thought state parsing, anchor caching mechanisms, or direct thought mutation paths.

### Verify

```bash
# Discover and run the project's static analysis and module dependency boundary linter to verify that all protocol and session controllers import thought capabilities exclusively from the designated internal thought-handler module.
# Discover and execute the automated test suite covering session restoration and protocol tool operations to confirm unified thought lifecycle execution without regressions.
```

**Accept when:**
- Module boundary analysis confirms zero direct thought datastore mutations outside of the internal thought-handler module.
- All unit, integration, and protocol compliance tests pass with full schema validation and structured error handling verified.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>