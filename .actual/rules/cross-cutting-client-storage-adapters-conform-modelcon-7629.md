---
version: 2
name: cross-cutting-client-storage-adapters-conform-modelcon-7629
description: "Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Client Storage Adapters Conform Modelcontextprotocol Sdk"
metadata:
  actual:
    adr_id: 76293dc3-0857-4e63-86c5-390c93619d87
    status: accepted
    candidate_group_id: 092812f4-1d5d-45f1-8d9c-a9b72e9dbaf9
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Client Storage Adapters Conform Modelcontextprotocol Sdk

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all modules implementing OAuth server capabilities, client registration, or authorization flow handlers for the protocol server, and client storage and retrieval adapters serving authorization flows.

### Rules

- **R-ADR-001** MUST: Client storage adapters MUST conform to the `@modelcontextprotocol/sdk` client management interface, ensuring consistent client lookup and metadata handling across storage backends.
- **R-ADR-002** MANDATORY: Follow lock-version grounding procedures before upgrades and maintain integration tests validating client and provider contracts.
- **R-ADR-003** MANDATORY: Ensure in-memory client caches maintain cache-invalidation or short time-to-live policies aligned with persistent storage.
- **R-ADR-004** MANDATORY: Implement client storage adapters by encapsulating persistence engine calls behind the protocol SDK client management interfaces.
- **R-ADR-005** MANDATORY: Ensure cryptographic state tokens and authorization codes use cryptographically strong generation and hashing primitives.

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
Claude Code MUST NOT skip or defer verification. Continuous integration automated test suites, static analysis, type checking, and mandatory peer review enforce these rules. Violation handling results in build failures and pull request blocks.
</enforcement>