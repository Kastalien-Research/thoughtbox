---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-m-0e1f
description: "Adoption of node:crypto for Native Cryptographic Operations: Modules Not Introduce Third Party Cryptographic"
metadata:
  actual:
    adr_id: 0e1f07c8-c8c9-4275-bf3d-764bd5c86278
    status: accepted
    candidate_group_id: 83659c58-c187-4a51-b487-8cea96be5702
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of node:crypto for Native Cryptographic Operations: Modules Not Introduce Third Party Cryptographic

Scope: applies to `src/peer-notebook/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CRYPTO-001** MUST_NOT: Modules MUST NOT introduce third-party cryptographic utility packages when equivalent functionality is natively provided by node:crypto.

### Verify

```bash
# Discover and execute the project static analysis script from the project manifest
# Discover and run the project test suite
```

**Accept when:**
- Static analysis validates that all cryptographic imports use the protocol-prefixed core library specifier without third-party cryptographic utility dependencies.
- Automated test suites pass with all cryptographic hashing and token generation operations behaving deterministically across repository and broker layers.

<enforcement>
Verification is mandatory. Claude Code MUST NOT skip or defer verification.
</enforcement>