---
version: 2
name: cross-cutting-crypto-core-cryptographic-primitives-com-89f8
description: "Adoption of node:crypto for Core Cryptographic Primitives: Components Encapsulate Repetitive Cryptographic Hashing Patterns"
metadata:
  actual:
    adr_id: 89f8afd9-afe6-4ad1-baef-1b0fc8b8baff
    status: accepted
    candidate_group_id: 2e5354bd-d96c-4b7a-ae27-4faea2ca97f6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto for Core Cryptographic Primitives: Components Encapsulate Repetitive Cryptographic Hashing Patterns

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all application modules, runtime providers, consensus handlers, repository layers, and protocol services requiring cryptographic hashing, message digests, or secure identifier generation.

### Rules

- **R-CRYPTO-001** MAY: Components MAY encapsulate repetitive cryptographic hashing patterns behind domain-specific internal utility abstractions provided the underlying implementation delegates to node:crypto.

### Verify

```bash
# Discover and execute project static analysis, linting, and test suites from the manifest
# to verify node:crypto protocol scheme prefix usage and deterministic cryptographic outputs.
```

**Accept when:**
- Static analysis reports zero non-prefixed or third-party cryptographic module imports across all governed packages.
- All automated test suites pass with deterministic cryptographic outputs and no runtime initialization errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Continuous integration builds fail upon detection of disallowed third-party crypto dependencies or non-prefixed import specifiers.
</enforcement>