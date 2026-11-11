---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-d-5e7b
description: "Adoption of node:crypto for Native Cryptographic Operations: Developers Inspect Repository Dependency Manifest Authoritative"
metadata:
  actual:
    adr_id: 5e7b105c-47e9-4690-9499-8dfe48938cb8
    status: accepted
    candidate_group_id: 83659c58-c187-4a51-b487-8cea96be5702
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of node:crypto for Native Cryptographic Operations: Developers Inspect Repository Dependency Manifest Authoritative

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all backend domain services, broker components, repository stores, and persistence adapters requiring cryptographic operations or secure identifier generation.

### Rules

- **R-CRYPTO-001** MUST: Developers MUST inspect the repository dependency manifest and authoritative lock artifact to verify runtime engine compatibility prior to invoking cryptographic module APIs.

### Verify

```bash
# Discover the repository static analysis script from the project manifest and execute it to verify that all cryptographic imports conform to the protocol-prefixed core module specifier.
# Discover and run the project test suite to validate cryptographic operations, key generation routines, and broker dispatch integrity.
```

**Accept when:**
- Static analysis validates that all cryptographic imports use the protocol-prefixed core library specifier without third-party cryptographic utility dependencies.
- Automated test suites pass with all cryptographic hashing and token generation operations behaving deterministically across repository and broker layers.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis and peer code review enforce that unapproved third-party cryptographic dependencies or un-prefixed core module imports are blocked.
</enforcement>