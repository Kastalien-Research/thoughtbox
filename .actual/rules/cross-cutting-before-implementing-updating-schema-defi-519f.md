---
version: 2
name: cross-cutting-before-implementing-updating-schema-defi-519f
description: "Zod Schema Validation for Protocol Tool Input Contracts: Before Implementing Updating Schema Definitions Consumer"
metadata:
  actual:
    adr_id: 519f846e-c4bd-45e2-ac7c-f2652a9db9bb
    status: accepted
    candidate_group_id: f8c6cfb7-64f5-472b-bf29-b0e3753683a5
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
---

# Zod Schema Validation for Protocol Tool Input Contracts: Before Implementing Updating Schema Definitions Consumer

Scope: applies to `src/protocol/**`.

These rules are ALWAYS ACTIVE for protocol tool definitions, operational input contracts, and runtime input validation at protocol service boundaries.

### Rules

- **R-ZOD-001** MUST: Before implementing or updating schema definitions, the consumer MUST inspect the repository lock artifact to determine the exact resolved version of the schema validation library and verify API compatibility.

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