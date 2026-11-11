---
version: 2
name: cross-cutting-crypto-module-cryptographic-operations-i-3534
description: "Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Components Requiring Cryptographic Operations Cryptographically Secure"
metadata:
  actual:
    adr_id: 3534cc4a-df7e-438e-8c07-52e8cba30012
    status: accepted
    candidate_group_id: 7d6316d2-f20d-4045-a245-65f14eccb677
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Components Requiring Cryptographic Operations Cryptographically Secure

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for modules requiring cryptographically secure unique identifiers, session keys, invocation tracking tokens, entity identifiers, and subsystems computing cryptographic hashes, integrity digests, or checksums.

### Rules

- **R-CRYPTO-001** MUST: Components requiring cryptographic operations, cryptographically secure identifier generation, or cryptographic hashing MUST import and utilize the runtime native node:crypto module via the explicit protocol prefix.

### Verify

```bash
# Discover and run the project static analysis and lint check scripts to verify all cryptographic imports use the explicit protocol prefix.
# Discover and run the test suite to validate that identifier generation and hashing functions execute correctly across all target environments.
```

**Accept when:**
- Static analysis reports zero unprefixed core cryptographic module imports across all source files.
- All unit and integration test suites pass without cryptographic primitive or resolution errors.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>