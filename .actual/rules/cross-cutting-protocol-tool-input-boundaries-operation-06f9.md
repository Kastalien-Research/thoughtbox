---
version: 2
name: cross-cutting-protocol-tool-input-boundaries-operation-06f9
description: "Zod Schema Validation for Protocol Tool Input Contracts: Protocol Tool Input Boundaries Operational Parameters"
metadata:
  actual:
    adr_id: 06f977f1-0a84-4f66-a53f-bf89777547aa
    status: accepted
    candidate_group_id: f8c6cfb7-64f5-472b-bf29-b0e3753683a5
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
---

# Zod Schema Validation for Protocol Tool Input Contracts: Protocol Tool Input Boundaries Operational Parameters

Scope: applies to `src/protocol/**`.

These rules are ALWAYS ACTIVE for protocol tool definitions, operational input contracts, and runtime input validation at protocol service boundaries.

### Rules

- **R-ZOD-001** MUST: Protocol tool input boundaries and operational parameters MUST be defined and validated using Zod object schemas.

### Verify

```bash
# Discover and run the project test suite covering protocol validation contracts
# Discover and run the project static type checker and linter across protocol tool definitions
```

**Accept when:**
- All protocol tool operations validate inputs against defined schemas without unhandled runtime parsing errors
- Static type checks and automated test suites pass across all protocol tool definitions

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration pipeline and peer review.
</enforcement>