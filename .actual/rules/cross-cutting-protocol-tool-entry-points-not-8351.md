---
version: 2
name: cross-cutting-protocol-tool-entry-points-not-8351
description: "Zod Schema Validation for Protocol Tool Input Contracts: Protocol Tool Entry Points Not Accept"
metadata:
  actual:
    adr_id: 8351c0f1-5d88-46a1-b126-f4d321e4820b
    status: accepted
    candidate_group_id: f8c6cfb7-64f5-472b-bf29-b0e3753683a5
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
---

# Zod Schema Validation for Protocol Tool Input Contracts: Protocol Tool Entry Points Not Accept

Scope: applies to `src/protocol/**`.

These rules are ALWAYS ACTIVE for protocol tool definitions, operational input contracts, and runtime input validation at protocol service boundaries.

### Rules

- **R-PROT-001** MUST_NOT: Protocol tool entry points MUST NOT accept raw unvalidated input payloads without passing them through schema validation.

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