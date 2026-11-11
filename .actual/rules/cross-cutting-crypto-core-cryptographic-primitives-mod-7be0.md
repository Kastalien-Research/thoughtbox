---
version: 2
name: cross-cutting-crypto-core-cryptographic-primitives-mod-7be0
description: "Adoption of node:crypto for Core Cryptographic Primitives: Modules Import Core Module Explicit Protocol"
metadata:
  actual:
    adr_id: 7be0516f-10ac-411d-83b9-fea08573368b
    status: accepted
    candidate_group_id: 2e5354bd-d96c-4b7a-ae27-4faea2ca97f6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto for Core Cryptographic Primitives: Modules Import Core Module Explicit Protocol

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all application modules, runtime providers, consensus handlers, repository layers, and protocol services requiring cryptographic hashing, message digests, or secure identifier generation.

### Rules

- **R-CRYPTO-001** MUST: Modules MUST import the core module using the explicit protocol scheme prefix node:crypto rather than bare module specifiers.

### Verify

```bash
# Discover the project static analysis and linting scripts from the manifest and execute them
# Example discovery & lint command:
npm run lint
# Discover and run the project test execution suites:
npm test
```

**Accept when:**
- Static analysis reports zero non-prefixed or third-party cryptographic module imports across all governed packages.
- All automated test suites pass with deterministic cryptographic outputs and no runtime initialization errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated linting, static analysis rules, and architectural code reviews during continuous integration pipelines.
</enforcement>