---
version: 2
name: cross-cutting-cryptographic-operations-supporting-auth-8f4e
description: "Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Cryptographic Operations Supporting Authorization Redirects State"
metadata:
  actual:
    adr_id: 8f4e5fb3-f5e2-40b8-af2f-451f11cac134
    status: accepted
    candidate_group_id: 092812f4-1d5d-45f1-8d9c-a9b72e9dbaf9
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Cryptographic Operations Supporting Authorization Redirects State

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all modules implementing OAuth server capabilities, client registration, or authorization flow handlers for the protocol server, and client storage and retrieval adapters serving authorization flows.

### Rules

- **R-MCP-001** MUST: Cryptographic operations supporting authorization redirects and state parameters MUST utilize secure hashing and cryptographically strong pseudo-random number generation.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration test suites, static analysis, and mandatory peer review.
</enforcement>