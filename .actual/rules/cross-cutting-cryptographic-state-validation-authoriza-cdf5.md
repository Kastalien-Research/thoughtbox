---
version: 2
name: cross-cutting-cryptographic-state-validation-authoriza-cdf5
description: "Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Cryptographic State Validation Authorization Code Handling"
metadata:
  actual:
    adr_id: cdf51b50-5bc9-4afd-bb27-4d231a160f21
    status: accepted
    candidate_group_id: d76778ae-1112-4ac9-b29f-9117c34b6f87
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Cryptographic State Validation Authorization Code Handling

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-AUTH-001** MUST: Cryptographic state validation and authorization code handling in provider interactions MUST utilize secure random byte generation and SHA-256 hash digests to safeguard authorization transfers.

### Verify

```bash
# Discover and execute project build and test scripts covering authentication provider flows
# Execute project static analysis and type checking utilities
# Inspect dependency lock artifact to confirm installed versions of @modelcontextprotocol/sdk match repository constraints
```

**Accept when:**
- All automated authentication provider test suites pass without assertion failures.
- Static type analysis confirms zero type errors across modules importing `@modelcontextprotocol/sdk` authentication contracts.
- OAuth provider and client storage components strictly conform to the expected `@modelcontextprotocol/sdk` interface signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests introducing non-compliant authorization patterns or bypassing SDK interfaces will be blocked from merging.
</enforcement>