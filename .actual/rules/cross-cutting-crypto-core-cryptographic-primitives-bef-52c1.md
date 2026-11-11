---
version: 2
name: cross-cutting-crypto-core-cryptographic-primitives-bef-52c1
description: "Adoption of node:crypto for Core Cryptographic Primitives: Before Consuming Any Versioned Runtime Provided"
metadata:
  actual:
    adr_id: 52c17654-f896-4a25-8863-57a2f46b6ceb
    status: accepted
    candidate_group_id: 2e5354bd-d96c-4b7a-ae27-4faea2ca97f6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto for Core Cryptographic Primitives: Before Consuming Any Versioned Runtime Provided

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all application modules, runtime providers, consensus handlers, repository layers, and protocol services requiring cryptographic hashing, message digests, or secure identifier generation.

### Rules

- **R-CRYPTO-001** MUST: Before consuming any versioned or runtime-provided library interface, the implementation MUST inspect the project dependency resolution artifacts to confirm API availability and behavioral compatibility.
- **R-CRYPTO-002** MUST: Ensure all import declarations targeting cryptographic capabilities explicitly specify the core module protocol scheme prefix.
- **R-CRYPTO-003** SHOULD: Prefer asynchronous or stream-based hashing utilities when processing large payloads or state transfers to prevent blocking the primary runtime event loop.

### Verify

```bash
# Discover the project static analysis and linting scripts from the manifest and execute them
# to verify that all cryptographic module imports use the explicit protocol scheme prefix.
# Discover and run the project test execution suites to verify that cryptographic digests,
# entity identifiers, and consensus hashes produce expected deterministic values across all test cases.
```

**Accept when:**
- Static analysis reports zero non-prefixed or third-party cryptographic module imports across all governed packages.
- All automated test suites pass with deterministic cryptographic outputs and no runtime initialization errors.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>