---
version: 2
name: cross-cutting-protocol-tools-session-handlers-validate-5f46
description: "Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Protocol Tools Session Handlers Validate Inbound"
metadata:
  actual:
    adr_id: 5f46f124-e3a8-4784-985a-7c3ca53c4114
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

# Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Protocol Tools Session Handlers Validate Inbound

Scope: applies to `src/protocol/**`, `src/sessions/**`, `src/thought/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TH-001** MUST: Protocol tools and session handlers MUST validate all inbound operation arguments against formal schemas prior to invoking thought-handler operations.

### Verify

```bash
# Discover and run the project's static analysis and module dependency boundary linter
# Discover and execute the automated test suite covering session restoration and protocol tool operations
```

**Accept when:**
- Module boundary analysis confirms zero direct thought datastore mutations outside of the internal thought-handler module.
- All unit, integration, and protocol compliance tests pass with full schema validation and structured error handling verified.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration and peer architectural code review.
</enforcement>