---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-c-ce46
description: "Adoption of node:crypto for Native Cryptographic Operations: Cryptographic Module Imports Use Explicit Protocol"
metadata:
  actual:
    adr_id: ce4654de-ea14-4cfc-8c42-a94851bea4fd
    status: accepted
    candidate_group_id: 83659c58-c187-4a51-b487-8cea96be5702
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of node:crypto for Native Cryptographic Operations: Cryptographic Module Imports Use Explicit Protocol

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CRYPTO-001** MUST: Cryptographic module imports MUST use the explicit protocol-prefixed module specifier format when referencing the core library.

### Verify

```bash
# Discover and run the project static analysis script from the project manifest
# Example: npm run lint / yarn lint
# Discover and run the project test suite
# Example: npm test / yarn test
```

**Accept when:**
- Static analysis validates that all cryptographic imports use the protocol-prefixed core library specifier without third-party cryptographic utility dependencies.
- Automated test suites pass with all cryptographic hashing and token generation operations behaving deterministically across repository and broker layers.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>