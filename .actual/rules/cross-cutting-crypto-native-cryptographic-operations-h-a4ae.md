---
version: 2
name: cross-cutting-crypto-native-cryptographic-operations-h-a4ae
description: "Standardization on node:crypto for Native Cryptographic Operations and Hashing: Data Digest Generation Utilize Crypto Createhash"
metadata:
  actual:
    adr_id: a4ae2232-dd0c-4672-bb17-9ad1e0d1587a
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

# Standardization on node:crypto for Native Cryptographic Operations and Hashing: Data Digest Generation Utilize Crypto Createhash

Scope: applies to `apps/web/.claude/hooks/**`, `apps/web/src/lib/api-keys/**`.

These rules are ALWAYS ACTIVE for server-side application library modules, automation hooks, tooling bridges, and internal runtime scripts computing cryptographic hashes or digests.

### Rules

- **R-CRYPTO-001** MUST: Data digest generation MUST utilize crypto.createHash with standardized hashing algorithms across application components and execution bridges.
- **R-CRYPTO-002** MUST: Module import declarations uniformly adopt the protocol-prefixed namespace (`node:crypto`) rather than legacy un-prefixed identifiers to prevent namespace ambiguity.

### Verify

```bash
# Discover and run the repository static analysis script from the dependency manifest
# to verify imports match the core runtime module namespace.
# Locate and run the test suite defined in the build configuration to verify
# cryptographic hash outputs and token generation behavior.
```

**Accept when:**
- All imports for cryptographic hashing and key generation resolve to the core runtime module namespace with zero external library substitutions.
- Automated test suites and static analysis checks pass with zero diagnostic warnings or unresolved module specifiers.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis checks and peer code reviews enforce these rules, and unvetted external cryptographic packages or legacy un-prefixed module specifiers are blocked.
</enforcement>