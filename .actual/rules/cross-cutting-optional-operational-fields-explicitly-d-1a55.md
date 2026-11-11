---
version: 2
name: cross-cutting-optional-operational-fields-explicitly-d-1a55
description: "Zod Schema Validation for Protocol Tool Input Contracts: Optional Operational Fields Explicitly Designated Schema"
metadata:
  actual:
    adr_id: 1a55d8ba-2948-4709-88e0-9f8a41c54c2a
    status: accepted
    candidate_group_id: f8c6cfb7-64f5-472b-bf29-b0e3753683a5
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
---

# Zod Schema Validation for Protocol Tool Input Contracts: Optional Operational Fields Explicitly Designated Schema

Scope: applies to `src/protocol/**`.

These rules are ALWAYS ACTIVE for protocol tool definitions and operational input contracts.

### Rules

- **R-ZOD-001** SHOULD: Optional operational fields SHOULD be explicitly designated using schema optionality modifiers rather than permitting unvalidated loose object structures.

### Verify

```bash
# Discover and run the project test suite covering protocol validation contracts
# Discover and run the project static type checker and linter across protocol tool definitions
```

**Accept when:**
- All protocol tool operations validate inputs against defined schemas without unhandled runtime parsing errors
- Static type checks and automated test suites pass across all protocol tool definitions

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration and peer review.
</enforcement>