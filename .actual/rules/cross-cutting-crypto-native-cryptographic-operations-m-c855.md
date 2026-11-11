---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-m-c855
description: "Adoption of node:crypto for Native Cryptographic Operations: Modules Generating Internal Storage Keys Entity"
metadata:
  actual:
    adr_id: c855a724-1472-4a77-8b8b-65a7c192262f
    status: accepted
    candidate_group_id: 83659c58-c187-4a51-b487-8cea96be5702
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of node:crypto for Native Cryptographic Operations: Modules Generating Internal Storage Keys Entity

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CRYPTO-001** SHOULD: Modules generating internal storage keys or entity identifiers use cryptographically secure random generators or deterministic hashing functions from node:crypto.

### Verify

```bash
# Discover the repository static analysis script from the project manifest and execute it to verify that all cryptographic imports conform to the protocol-prefixed core module specifier.
# Discover and run the project test suite to validate cryptographic operations, key generation routines, and broker dispatch integrity.
```

**Accept when:**
- Static analysis validates that all cryptographic imports use the protocol-prefixed core library specifier without third-party cryptographic utility dependencies.
- Automated test suites pass with all cryptographic hashing and token generation operations behaving deterministically across repository and broker layers.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>