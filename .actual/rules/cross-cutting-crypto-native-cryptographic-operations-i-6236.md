---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-i-6236
description: "Adoption of node:crypto for Native Cryptographic Operations: Insecure Pseudo Random Number Generators Non"
metadata:
  actual:
    adr_id: 6236c3f6-c8b0-44e8-9fb9-6a9426592321
    status: accepted
    candidate_group_id: 83659c58-c187-4a51-b487-8cea96be5702
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of node:crypto for Native Cryptographic Operations: Insecure Pseudo Random Number Generators Non

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CRYPTO-001** MUST_NOT: Insecure pseudo-random number generators or non-cryptographic hash functions MUST NOT be used for security-sensitive tokens, identifiers, or signature validation.

### Verify

```bash
# Discover the repository static analysis script from the project manifest and execute it to verify cryptographic imports
# Discover and run the project test suite to validate cryptographic operations
```

**Accept when:**
- Static analysis validates that all cryptographic imports use the protocol-prefixed core library specifier without third-party cryptographic utility dependencies.
- Automated test suites pass with all cryptographic hashing and token generation operations behaving deterministically across repository and broker layers.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>