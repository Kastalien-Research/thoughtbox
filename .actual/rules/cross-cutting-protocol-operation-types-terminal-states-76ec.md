---
version: 2
name: cross-cutting-protocol-operation-types-terminal-states-76ec
description: "Zod Schema Validation for Protocol Tool Input Contracts: Protocol Operation Types Terminal States Modeled"
metadata:
  actual:
    adr_id: 76ec6fc7-b0bf-486a-8416-d9b4186ce1d9
    status: accepted
    candidate_group_id: f8c6cfb7-64f5-472b-bf29-b0e3753683a5
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
---

# Zod Schema Validation for Protocol Tool Input Contracts: Protocol Operation Types Terminal States Modeled

Scope: applies to `src/protocol/**`.

These rules are ALWAYS ACTIVE for protocol tool definitions and operational input contracts.

### Rules

- **R-ZOD-001** MUST: Protocol operation types and terminal states MUST be modeled using strict enumeration schemas to enforce explicit operation dispatching.

### Verify

```bash
# Discover and run the project test suite covering protocol validation contracts
# Discover and run the project static type checker and linter across protocol tool definitions
```

**Accept when:**
- All protocol tool operations validate inputs against defined schemas without unhandled runtime parsing errors
- Static type checks and automated test suites pass across all protocol tool definitions

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>