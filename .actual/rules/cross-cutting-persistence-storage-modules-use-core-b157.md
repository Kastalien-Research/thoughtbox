---
version: 2
name: cross-cutting-persistence-storage-modules-use-core-b157
description: "Adoption of Crypto Module for Persistence Cryptographic Primitives: Persistence Storage Modules Use Core Crypto"
metadata:
  actual:
    adr_id: b157cc1b-bd22-4ebd-837c-0d66a24f85b5
    status: accepted
    candidate_group_id: ebcc38e4-6aa5-43a9-895f-87776cec82dc
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of Crypto Module for Persistence Cryptographic Primitives: Persistence Storage Modules Use Core Crypto

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all persistence, indexing, and storage engine modules that perform cryptographic hashing, token creation, or identifier generation.

### Rules

- **R-CRYPTO-001** MUST: Persistence and storage modules MUST use the core crypto module for all cryptographic operations, digest calculations, and cryptographically secure random identifier generation.

### Verify

```bash
# Discover the test runner from the project repository configuration and execute the test suite covering persistence and storage modules.
# Discover the static analysis configuration and run dependency validation to confirm no unauthorized third-party cryptographic packages are imported in storage layers.
```

**Accept when:**
- All persistence and storage test suites pass with zero cryptographic or identifier generation failures.
- Static analysis confirms storage modules reference exclusively the core crypto module for cryptographic operations.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>