---
version: 2
name: cross-cutting-storage-engines-isolate-direct-crypto-79b3
description: "Adoption of Crypto Module for Persistence Cryptographic Primitives: Storage Engines Isolate Direct Crypto Invocations"
metadata:
  actual:
    adr_id: 79b300f1-a63c-424a-8d82-545f78b060be
    status: accepted
    candidate_group_id: ebcc38e4-6aa5-43a9-895f-87776cec82dc
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of Crypto Module for Persistence Cryptographic Primitives: Storage Engines Isolate Direct Crypto Invocations

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all persistence, indexing, and storage engine modules that perform cryptographic hashing, token creation, or identifier generation.

### Rules

- **R-CRYPTO-001** SHOULD: Storage engines SHOULD isolate direct crypto invocations behind persistence-specific helper functions or repository abstractions to prevent leaky runtime dependencies.

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