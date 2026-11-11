---
version: 2
name: cross-cutting-schema-properties-include-descriptive-me-de59
description: "Zod Schema Validation for Protocol Tool Input Contracts: Schema Properties Include Descriptive Metadata Description"
metadata:
  actual:
    adr_id: de59ca29-df88-4172-ac79-5fa6b482cb13
    status: accepted
    candidate_group_id: f8c6cfb7-64f5-472b-bf29-b0e3753683a5
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
---

# Zod Schema Validation for Protocol Tool Input Contracts: Schema Properties Include Descriptive Metadata Description

Scope: applies to `src/protocol/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ZOD-001** SHOULD: Schema properties SHOULD include descriptive metadata using schema description methods to document protocol operations and parameters.

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