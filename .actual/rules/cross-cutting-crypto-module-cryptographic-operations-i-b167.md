---
version: 2
name: cross-cutting-crypto-module-cryptographic-operations-i-b167
description: "Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Unique Identifiers Generated Session Management Invocation"
metadata:
  actual:
    adr_id: b167c566-2cce-4199-adc7-f8eb6f2043a5
    status: accepted
    candidate_group_id: 7d6316d2-f20d-4045-a245-65f14eccb677
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Unique Identifiers Generated Session Management Invocation

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for modules requiring cryptographically secure unique identifiers, session keys, invocation tracking tokens, entity identifiers, cryptographic hashes, integrity digests, checksums, or constant-time comparisons.

### Rules

- **R-CRYPTO-001** MUST: Unique identifiers generated for session management, invocation tracking, and storage entity keys MUST use cryptographically secure random identifier functions provided by the node:crypto module.
- **R-CRYPTO-002** MUST: All imports of the core cryptographic module must use the explicit protocol prefix specifier in module declarations.

### Verify

```bash
# Discover and run the project static analysis and lint check scripts to verify all cryptographic imports use the explicit protocol prefix.
# Discover and run the test suite to validate that identifier generation and hashing functions execute correctly across all target environments.
```

**Accept when:**
- Static analysis reports zero unprefixed core cryptographic module imports across all source files.
- All unit and integration test suites pass without cryptographic primitive or resolution errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated static analysis checks in the continuous integration pipeline and peer code review verification.
</enforcement>