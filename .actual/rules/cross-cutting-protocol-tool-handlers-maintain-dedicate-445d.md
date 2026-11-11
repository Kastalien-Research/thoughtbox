---
version: 2
name: cross-cutting-protocol-tool-handlers-maintain-dedicate-445d
description: "Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Protocol Tool Handlers Maintain Dedicated Memory"
metadata:
  actual:
    adr_id: 445d4702-08a2-4bff-a4d0-c76ca9c34661
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

# Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Protocol Tool Handlers Maintain Dedicated Memory

Scope: applies to `src/protocol/**`, `src/sessions/**`, `src/thought/**`.

These rules are ALWAYS ACTIVE for all protocol tool handlers, operational controllers managing cognitive operations, reasoning workflows, plan execution, session restoration handlers, and query controllers.

### Rules

- **R-THOUGHT-001** MAY: Protocol tool handlers MAY maintain dedicated in-memory state adapters provided that all persistent thought transitions delegate synchronously or asynchronously to the internal thought-handler module.
- **R-THOUGHT-002** MANDATORY: Consumers implementing new protocol tools must declare input validation schemas at the controller boundary before delegating domain operations to the internal thought-handler module.
- **R-THOUGHT-003** MANDATORY: Session restoration handlers must isolate cache mutations from primary thought datastore queries to ensure partial restoration failures do not corrupt cached anchor states.

### Verify

```bash
# Discover and run the project's static analysis and module dependency boundary linter
# to verify that all protocol and session controllers import thought capabilities
# exclusively from the designated internal thought-handler module.
# (Run using the project's discovered test/lint runner)

# Discover and execute the automated test suite covering session restoration
# and protocol tool operations to confirm unified thought lifecycle execution without regressions.
```

**Accept when:**
- Module boundary analysis confirms zero direct thought datastore mutations outside of the internal thought-handler module.
- All unit, integration, and protocol compliance tests pass with full schema validation and structured error handling verified.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated build rejection and code review blocks apply if architectural boundary checks detect bypassed thought handling or duplicate state mutations.
</enforcement>