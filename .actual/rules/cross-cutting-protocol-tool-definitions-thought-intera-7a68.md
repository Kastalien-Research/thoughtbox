---
version: 2
name: cross-cutting-protocol-tool-definitions-thought-intera-7a68
description: "Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Protocol Tool Definitions Thought Interaction Endpoints"
metadata:
  actual:
    adr_id: 7a68d497-860a-462a-ad31-40b7ce077e60
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

# Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Protocol Tool Definitions Thought Interaction Endpoints

Scope: applies to `src/protocol/**`, `src/sessions/**`, `src/thought/**`.

These rules are ALWAYS ACTIVE for all protocol tool handlers, operational controllers, and session restoration handlers that manage cognitive operations, reasoning workflows, or plan execution.

### Rules

- **R-THOUGHT-001** MUST: All protocol tool definitions, thought interaction endpoints, and session restoration handlers MUST route cognitive state manipulation, thought querying, and thought lifecycle operations through the designated internal thought-handler module.

### Verify

```bash
# Discover and run the project's static analysis and module dependency boundary linter
# to verify that all protocol and session controllers import thought capabilities exclusively
# from the designated internal thought-handler module.
# (Derive project-specific build/lint commands from the repository manifest)
```

**Accept when:**
- Module boundary analysis confirms zero direct thought datastore mutations outside of the internal thought-handler module.
- All unit, integration, and protocol compliance tests pass with full schema validation and structured error handling verified.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>