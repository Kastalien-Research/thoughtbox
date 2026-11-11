---
version: 2
name: cross-cutting-crypto-module-cryptographic-operations-i-dcb0
description: "Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Subsystems Not Use Non Cryptographic Pseudo"
metadata:
  actual:
    adr_id: dcb0e290-108e-4a4c-9659-b72004e8a9f7
    status: accepted
    candidate_group_id: 7d6316d2-f20d-4045-a245-65f14eccb677
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Subsystems Not Use Non Cryptographic Pseudo

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for modules requiring cryptographically secure unique identifiers, session keys, invocation tracking tokens, or entity identifiers, subsystems computing cryptographic hashes, integrity digests, or checksums, and services requiring constant-time comparisons or cryptographic security boundaries.

### Rules

- **R-CRYPTO-001** SHOULD_NOT: Subsystems SHOULD NOT use non-cryptographic pseudo-random number generators for identifier generation or security tokens.
- **R-CRYPTO-002** MANDATORY: All imports of the core cryptographic module must use the explicit protocol prefix specifier in module declarations.
- **R-CRYPTO-003** MANDATORY: Identifier generation for tracking runtime invocations, user sessions, and persistent entities should standardize on native secure identifier generation functions.
- **R-CRYPTO-004** MANDATORY: Prior to writing code that uses a versioned library, follow the lock-version grounding process to inspect manifest, build tool, lock/resolution artifact, and official documentation.

### Verify

```bash
# Discover and run the project static analysis and lint check scripts to verify all cryptographic imports use the explicit protocol prefix.
# Discover and run the test suite to validate that identifier generation and hashing functions execute correctly across all target environments.
```

**Accept when:**
- Static analysis reports zero unprefixed core cryptographic module imports across all source files.
- All unit and integration test suites pass without cryptographic primitive or resolution errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>