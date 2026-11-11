---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-h-a1db
description: "Standardization on node:crypto for Native Cryptographic Operations and Hashing: Codebases Not Import External Third Party"
metadata:
  actual:
    adr_id: a1db56c9-a133-4f78-8698-9feb7aba4cad
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

# Standardization on node:crypto for Native Cryptographic Operations and Hashing: Codebases Not Import External Third Party

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/src/lib/api-keys/**`.

These rules are ALWAYS ACTIVE for server-side application library modules handling token, secret, or API key generation, as well as automation hooks, tooling bridges, and internal runtime scripts computing cryptographic hashes or digests.

### Rules

- **R-CRYPTO-001** MUST_NOT: Codebases MUST NOT import external third-party cryptographic utility packages when equivalent functionality is natively provided by node:crypto.

### Verify

```bash
# Discover the repository static analysis script from the dependency manifest and execute it to verify imports match the core runtime module namespace.
# Locate and run the test suite defined in the build configuration to verify cryptographic hash outputs and token generation behavior.
npm run lint
npm test
```

**Accept when:**
- All imports for cryptographic hashing and key generation resolve to the core runtime module namespace with zero external library substitutions.
- Automated test suites and static analysis checks pass with zero diagnostic warnings or unresolved module specifiers.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests introducing unvetted external cryptographic packages or legacy un-prefixed module specifiers must be blocked until corrected.
</enforcement>