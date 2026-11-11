---
version: 2
name: cross-cutting-crypto-core-cryptographic-primitives-cry-5db4
description: "Adoption of node:crypto for Core Cryptographic Primitives: Cryptographic Operations Involving Sensitive Credential Verification"
metadata:
  actual:
    adr_id: 5db4ef3c-76be-4d86-8a2e-39871af05925
    status: accepted
    candidate_group_id: 2e5354bd-d96c-4b7a-ae27-4faea2ca97f6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto for Core Cryptographic Primitives: Cryptographic Operations Involving Sensitive Credential Verification

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CRYPTO-001** SHOULD: Cryptographic operations involving sensitive credential verification or message authentication SHOULD use constant-time comparison functions provided by node:crypto.

### Verify

```bash
# Discover and run the project static analysis and linting scripts from the manifest
# to verify that all cryptographic module imports use the explicit protocol scheme prefix.
# Discover and run the project test execution suites to verify deterministic cryptographic outputs.
```

**Accept when:**
- Static analysis reports zero non-prefixed or third-party cryptographic module imports across all governed packages.
- All automated test suites pass with deterministic cryptographic outputs and no runtime initialization errors.

<enforcement>
Claude Code MUST NOT skip or defer verification. All cryptographic module imports must be verified against the project manifest and static analysis rules.
</enforcement>