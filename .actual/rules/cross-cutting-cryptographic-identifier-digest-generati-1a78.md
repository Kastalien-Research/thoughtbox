---
version: 2
name: cross-cutting-cryptographic-identifier-digest-generati-1a78
description: "Adoption of Crypto Module for Persistence Cryptographic Primitives: Cryptographic Identifier Digest Generation Storage Operations"
metadata:
  actual:
    adr_id: 1a7851ff-5a2a-4934-baf1-f224cb6b2986
    status: accepted
    candidate_group_id: ebcc38e4-6aa5-43a9-895f-87776cec82dc
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of Crypto Module for Persistence Cryptographic Primitives: Cryptographic Identifier Digest Generation Storage Operations

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all persistence, indexing, and storage engine modules that perform cryptographic hashing, token creation, or identifier generation.

### Rules

- **R-CRYPTO-001** MUST: Cryptographic identifier and digest generation in storage operations MUST be deterministic where data integrity verification is required and cryptographically random where collision resistance is required.

### Verify

```bash
# Discover the test runner from the project repository configuration and execute the test suite covering persistence and storage modules.
# Discover the static analysis configuration and run dependency validation to confirm no unauthorized third-party cryptographic packages are imported in storage layers.
```

**Accept when:**
- All persistence and storage test suites pass with zero cryptographic or identifier generation failures.
- Static analysis confirms storage modules reference exclusively the core crypto module for cryptographic operations.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>