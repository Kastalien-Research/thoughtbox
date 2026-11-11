---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-h-fc55
description: "Standardization on node:crypto for Native Cryptographic Operations and Hashing: Consumers Inspect Repository Dependency Manifest Lock"
metadata:
  actual:
    adr_id: fc55f7ac-f903-4a38-ab16-dc5b1d43cd4b
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

# Standardization on node:crypto for Native Cryptographic Operations and Hashing: Consumers Inspect Repository Dependency Manifest Lock

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/src/lib/api-keys/**`.

These rules are ALWAYS ACTIVE for server-side application library modules handling token, secret, or API key generation, and automation hooks, tooling bridges, and internal runtime scripts computing cryptographic hashes or digests.

### Rules

- **R-CRYPTO-001** MUST: Consumers MUST inspect the repository dependency manifest and lock artifact to verify the environment runtime baseline and guarantee compatibility with required cryptographic APIs before introducing code dependent on versioned runtime features.

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