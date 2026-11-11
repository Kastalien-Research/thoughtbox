---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-h-bd9e
description: "Standardization on node:crypto for Native Cryptographic Operations and Hashing: Server Side Services Automation Hooks Performing"
metadata:
  actual:
    adr_id: bd9e0ccb-a75a-438b-92a9-1a60e1afb1ad
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

# Standardization on node:crypto for Native Cryptographic Operations and Hashing: Server Side Services Automation Hooks Performing

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/src/lib/api-keys/**`.

These rules are ALWAYS ACTIVE for server-side application library modules and automation hooks performing cryptographic key generation or data digest computations.

### Rules

- **R-CRYPTO-001** MUST: Server-side services and automation hooks performing cryptographic key generation or data digest computations MUST adopt the core runtime module node:crypto.

### Verify

```bash
# Discover the repository static analysis script from the dependency manifest and execute it to verify imports match the core runtime module namespace.
# Locate and run the test suite defined in the build configuration to verify cryptographic hash outputs and token generation behavior.
```

**Accept when:**
- All imports for cryptographic hashing and key generation resolve to the core runtime module namespace with zero external library substitutions.
- Automated test suites and static analysis checks pass with zero diagnostic warnings or unresolved module specifiers.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>