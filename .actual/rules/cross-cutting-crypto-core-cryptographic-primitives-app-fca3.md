---
version: 2
name: cross-cutting-crypto-core-cryptographic-primitives-app-fca3
description: "Adoption of node:crypto for Core Cryptographic Primitives: Application Infrastructure Components Not Introduce External"
metadata:
  actual:
    adr_id: fca3eace-2765-4f86-ac43-734f2daf932b
    status: accepted
    candidate_group_id: 2e5354bd-d96c-4b7a-ae27-4faea2ca97f6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto for Core Cryptographic Primitives: Application Infrastructure Components Not Introduce External

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all application modules, runtime providers, consensus handlers, repository layers, and protocol services requiring cryptographic hashing, message digests, or secure identifier generation.

### Rules

- **R-CRYPTO-001** MUST_NOT: Application and infrastructure components MUST NOT introduce external third-party utility packages for standard hashing, message digest computation, or random identifier generation supported natively by node:crypto.
- **R-CRYPTO-002** MUST: Ensure all import declarations targeting cryptographic capabilities explicitly specify the core module protocol scheme prefix.
- **R-CRYPTO-003** SHOULD: Prefer asynchronous or stream-based hashing utilities when processing large payloads or state transfers to prevent blocking the primary runtime event loop.

### Verify

```bash
# Discover and run static analysis and linting scripts from the manifest
# to verify that all cryptographic module imports use the explicit protocol scheme prefix.
# Discover and run project test execution suites to verify deterministic cryptographic outputs.
```

**Accept when:**
- Static analysis reports zero non-prefixed or third-party cryptographic module imports across all governed packages.
- All automated test suites pass with deterministic cryptographic outputs and no runtime initialization errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration builds fail upon detection of disallowed third-party crypto dependencies or non-prefixed import specifiers.
</enforcement>