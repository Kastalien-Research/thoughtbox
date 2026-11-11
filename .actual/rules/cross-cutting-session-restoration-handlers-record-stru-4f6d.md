---
version: 2
name: cross-cutting-session-restoration-handlers-record-stru-4f6d
description: "Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Session Restoration Handlers Record Structured Diagnostic"
metadata:
  actual:
    adr_id: 4f6d3fdd-b8f3-4210-b84b-bd3ca9232e17
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

# Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Session Restoration Handlers Record Structured Diagnostic

Scope: applies to `src/protocol/**`, `src/sessions/**`, `src/thought/**`.

These rules are ALWAYS ACTIVE for all protocol tool handlers, operational controllers, session restoration handlers, and query controllers that manage cognitive operations, reasoning workflows, or plan execution.

### Rules

- **R-THOUGHT-001** SHOULD: Session restoration handlers record structured diagnostic warnings and fallback states when thought-handler queries or anchor restorations encounter unexpected errors.
- **R-THOUGHT-002** MANDATORY: Consumers implementing new protocol tools must declare input validation schemas at the controller boundary before delegating domain operations to the internal thought-handler module.
- **R-THOUGHT-003** MANDATORY: Session restoration handlers must isolate cache mutations from primary thought datastore queries to ensure partial restoration failures do not corrupt cached anchor states.

### Verify

```bash
# Discover and run the project's static analysis and module dependency boundary linter
# to verify that all protocol and session controllers import thought capabilities
# exclusively from the designated internal thought-handler module.
# (Run via project-specific command discovered from repository manifest)

# Discover and execute the automated test suite covering session restoration
# and protocol tool operations to confirm unified thought lifecycle execution.
# (Run via project-specific test command discovered from repository manifest)
```

**Accept when:**
- Module boundary analysis confirms zero direct thought datastore mutations outside of the internal thought-handler module.
- All unit, integration, and protocol compliance tests pass with full schema validation and structured error handling verified.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration and peer architectural code reviews enforce module dependency checks, static analysis rules, and core thought delegation.
</enforcement>