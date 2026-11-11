---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-h-8b5d
description: "Standardization on node:crypto for Native Cryptographic Operations and Hashing: Module Specifiers Importing Cryptographic Capabilities Utilize"
metadata:
  actual:
    adr_id: 8b5dcbd6-69a4-419e-bbb4-1d76a23d3a60
    status: accepted
    candidate_group_id: 76d85310-8fcf-4be4-859b-176d3ee23c07
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - .claude/hooks/**
      - src/lib/api-keys/**
---

# Standardization on node:crypto for Native Cryptographic Operations and Hashing: Module Specifiers Importing Cryptographic Capabilities Utilize

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/src/lib/api-keys/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CRYPTO-001** MUST: Module specifiers importing cryptographic capabilities MUST utilize the explicit protocol-prefixed namespace node:crypto rather than un-prefixed bare specifiers.

### Verify

```bash
# Discover the repository static analysis script from the dependency manifest and execute it to verify imports match the core runtime module namespace.
npm run lint

# Locate and run the test suite defined in the build configuration to verify cryptographic hash outputs and token generation behavior.
npm test
```

**Accept when:**
- All imports for cryptographic hashing and key generation resolve to the core runtime module namespace with zero external library substitutions.
- Automated test suites and static analysis checks pass with zero diagnostic warnings or unresolved module specifiers.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>