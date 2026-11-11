---
version: 2
name: cross-cutting-persistence-layer-modules-not-import-8db0
description: "Adoption of Crypto Module for Persistence Cryptographic Primitives: Persistence Layer Modules Not Import External"
metadata:
  actual:
    adr_id: 8db0015e-8563-49ce-9b86-4a7a4c9d1361
    status: accepted
    candidate_group_id: ebcc38e4-6aa5-43a9-895f-87776cec82dc
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of Crypto Module for Persistence Cryptographic Primitives: Persistence Layer Modules Not Import External

Scope: applies to `src/persistence/**`.

These rules are ALWAYS ACTIVE for all persistence, indexing, and storage engine modules that perform cryptographic hashing, token creation, or identifier generation.

### Rules

- **R-PERSIST-001** MUST_NOT: Persistence layer modules MUST NOT import external third-party hashing or cryptographic utility libraries for operations supported by the core crypto module.

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