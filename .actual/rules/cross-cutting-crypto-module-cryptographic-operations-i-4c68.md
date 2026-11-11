---
version: 2
name: cross-cutting-crypto-module-cryptographic-operations-i-4c68
description: "Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Engineers Inspect Project Lock Resolution Artifact"
metadata:
  actual:
    adr_id: 4c680089-8a87-4ed7-9281-0696af082b8c
    status: accepted
    candidate_group_id: 7d6316d2-f20d-4045-a245-65f14eccb677
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Engineers Inspect Project Lock Resolution Artifact

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for modules requiring cryptographically secure unique identifiers, session keys, invocation tracking tokens, entity identifiers, cryptographic hashes, integrity digests, checksums, or constant-time comparisons.

### Rules

- **R-CRYPTO-001** MUST: Engineers MUST inspect the project lock and resolution artifact before introducing or updating code to ensure platform compatibility with the adopted module APIs.
- **R-CRYPTO-002** MUST: All imports of the core cryptographic module must use the explicit protocol prefix specifier in module declarations.
- **R-CRYPTO-003** SHOULD: Identifier generation for tracking runtime invocations, user sessions, and persistent entities should standardize on native secure identifier generation functions.

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