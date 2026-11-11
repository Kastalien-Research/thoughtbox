---
version: 2
name: cross-cutting-client-metadata-persistence-layers-imple-db2f
description: "Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Client Metadata Persistence Layers Implement Management"
metadata:
  actual:
    adr_id: db2fbb27-f7b4-470e-895c-8a1f03e5ad48
    status: accepted
    candidate_group_id: d76778ae-1112-4ac9-b29f-9117c34b6f87
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Client Metadata Persistence Layers Implement Management

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MFA-001** MUST: Client metadata persistence layers MUST implement the client management contracts established by `@modelcontextprotocol/sdk/server/auth/clients.js` and `@modelcontextprotocol/sdk/shared/auth.js` to ensure uniform client resolution across authentication endpoints.

### Verify

```bash
# Discover the project build and test execution scripts declared in the repository configuration and execute the test suite covering authentication provider flows.
# Execute the project static analysis and type checking utilities to confirm conformance with `@modelcontextprotocol/sdk` authentication interfaces.
# Inspect the dependency lock artifact to confirm installed versions of `@modelcontextprotocol/sdk` match repository constraints.
```

**Accept when:**
- All automated authentication provider test suites pass without assertion failures.
- Static type analysis confirms zero type errors across modules importing `@modelcontextprotocol/sdk` authentication contracts.
- OAuth provider and client storage components strictly conform to the expected `@modelcontextprotocol/sdk` interface signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>