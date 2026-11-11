---
version: 2
name: cross-cutting-oauth-client-records-cached-memory-eef4
description: "Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Oauth Client Records Cached Memory While"
metadata:
  actual:
    adr_id: eef494d3-d0f9-4282-93d3-903161eb609e
    status: accepted
    candidate_group_id: 092812f4-1d5d-45f1-8d9c-a9b72e9dbaf9
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Oauth Client Records Cached Memory While

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all modules implementing OAuth server capabilities, client registration, or authorization flow handlers for the protocol server, and client storage and retrieval adapters serving authorization flows.

### Rules

- **R-OAUTH-001** SHOULD: OAuth client records SHOULD be cached in memory while maintaining backing persistence to prevent repeated remote queries during interactive consent cycles.
- **R-OAUTH-002** MANDATORY: Implement client storage adapters by encapsulating persistence engine calls behind the protocol SDK client management interfaces.
- **R-OAUTH-003** MANDATORY: Ensure cryptographic state tokens and authorization codes use cryptographically strong generation and hashing primitives.

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
Verification is mandatory. Claude Code MUST NOT skip or defer verification.
</enforcement>