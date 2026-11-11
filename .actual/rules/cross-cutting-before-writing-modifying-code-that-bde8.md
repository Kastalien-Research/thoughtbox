---
version: 2
name: cross-cutting-before-writing-modifying-code-that-bde8
description: "Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Before Writing Modifying Code That Integrates"
metadata:
  actual:
    adr_id: bde8a253-ee52-4832-9125-40921189b379
    status: accepted
    candidate_group_id: 092812f4-1d5d-45f1-8d9c-a9b72e9dbaf9
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Before Writing Modifying Code That Integrates

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all modules implementing OAuth server capabilities, client registration, or authorization flow handlers for the protocol server, and client storage and retrieval adapters serving authorization flows.

### Rules

- **R-MCP-001** MUST: Before writing or modifying code that integrates with `@modelcontextprotocol/sdk`, the consumer MUST inspect the project dependency lock artifact to determine the exact resolved SDK version and verify that all invoked authentication symbols exist in that version specification.

### Verify

```bash
# Discover and run the project's dependency validation script to confirm lock artifact integrity and protocol SDK resolution.
# Discover and run the project's test suite covering authentication provider flows and client storage contracts.
# Discover and run the static type checker to verify compliance with protocol SDK authentication interfaces.
```

**Accept when:**
- All authentication unit and integration test suites pass with zero failures across authorization code resolution and client lookup workflows.
- Static type checking succeeds against resolved protocol SDK authentication types with zero diagnostic errors.
- Client storage implementations fulfill the protocol client contract without unhandled exceptions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration automated test suites, static analysis, type checking, and mandatory peer reviews verify compliance. Violations result in automated build failure and pull request blockage.
</enforcement>