---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-m-e84d
description: "Adoption of node:crypto for Native Cryptographic Operations: Modules Requiring Cryptographic Hashing Random Token"
metadata:
  actual:
    adr_id: e84d1f01-b24d-4f0f-9a5a-7b5e5cee04bc
    status: accepted
    candidate_group_id: 83659c58-c187-4a51-b487-8cea96be5702
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of node:crypto for Native Cryptographic Operations: Modules Requiring Cryptographic Hashing Random Token

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all backend domain services, broker components, repository stores, and persistence adapters requiring cryptographic operations or secure identifier generation.

### Rules

- **R-CRYPTO-001** MUST: All modules requiring cryptographic hashing, random token generation, key derivation, or integrity validation MUST import and use the native node:crypto module.

### Verify

```bash
# Discover the repository static analysis script from the project manifest and execute it
# Discover and run the project test suite to validate cryptographic operations
```

**Accept when:**
- Static analysis validates that all cryptographic imports use the protocol-prefixed core library specifier without third-party cryptographic utility dependencies.
- Automated test suites pass with all cryptographic hashing and token generation operations behaving deterministically across repository and broker layers.

<enforcement>
Claude Code MUST NOT skip or defer verification. All changes touching security, broker routing, or repository persistence modules must be verified by automated static analysis and peer code review.
</enforcement>