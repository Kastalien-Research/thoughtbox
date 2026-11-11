---
version: 2
name: cross-cutting-crypto-module-cryptographic-operations-i-5936
description: "Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Components Not Introduce External Third Party"
metadata:
  actual:
    adr_id: 59367b5a-d129-4074-a53a-59e271d9423d
    status: accepted
    candidate_group_id: 7d6316d2-f20d-4045-a245-65f14eccb677
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Components Not Introduce External Third Party

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for modules requiring cryptographically secure unique identifiers, session keys, invocation tracking tokens, entity identifiers, cryptographic hashes, integrity digests, checksums, or constant-time comparisons.

### Rules

- **R-CRYPTO-001** MUST_NOT: Components MUST NOT introduce external third-party dependencies for standard cryptographic operations, pseudo-random identifier generation, or digest calculations supported by the native module.
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