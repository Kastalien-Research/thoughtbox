---
version: 2
name: cross-cutting-crypto-core-cryptographic-primitives-mod-716d
description: "Adoption of node:crypto for Core Cryptographic Primitives: Modules Requiring Cryptographic Capabilities Secure Pseudo"
metadata:
  actual:
    adr_id: 716d9995-03a2-437c-bbbb-13a912c517c4
    status: accepted
    candidate_group_id: 2e5354bd-d96c-4b7a-ae27-4faea2ca97f6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto for Core Cryptographic Primitives: Modules Requiring Cryptographic Capabilities Secure Pseudo

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CRYPTO-001** MUST: Modules requiring cryptographic capabilities, secure pseudo-random identifier generation, digital signatures, or cryptographic digests MUST import and use the platform core module node:crypto.

### Verify

```bash
# Discover and run the project static analysis, linting, and test execution scripts from the manifest
# to verify that all cryptographic module imports use the explicit node:crypto protocol scheme prefix
# and produce expected deterministic values across all test cases.
```

**Accept when:**
- Static analysis reports zero non-prefixed or third-party cryptographic module imports across all governed packages.
- All automated test suites pass with deterministic cryptographic outputs and no runtime initialization errors.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>