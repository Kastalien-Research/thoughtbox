---
version: 2
name: cross-cutting-crypto-module-cryptographic-operations-i-b4b8
description: "Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Cryptographic Digest Comparisons Token Authentications Utilize"
metadata:
  actual:
    adr_id: b4b8f962-a551-4260-afeb-f7b566c468ae
    status: accepted
    candidate_group_id: 7d6316d2-f20d-4045-a245-65f14eccb677
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Cryptographic Digest Comparisons Token Authentications Utilize

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for modules requiring cryptographically secure unique identifiers, session keys, invocation tracking tokens, or entity identifiers; subsystems computing cryptographic hashes, integrity digests, or checksums; and services requiring constant-time comparisons or cryptographic security boundaries.

### Rules

- **R-CRYPTO-001** SHOULD: Cryptographic digest comparisons and token authentications SHOULD utilize constant-time comparison functions from the node:crypto module to mitigate timing attack vulnerabilities.

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