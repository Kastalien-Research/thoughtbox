---
version: 2
name: cross-cutting-provider-implementations-not-introduce-b-8e35
description: "Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Provider Implementations Not Introduce Bespoke Authentication"
metadata:
  actual:
    adr_id: 8e350438-12d7-4a18-8fd0-1b71f851e0cb
    status: accepted
    candidate_group_id: d76778ae-1112-4ac9-b29f-9117c34b6f87
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Provider Implementations Not Introduce Bespoke Authentication

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MCP-001** MUST_NOT: Provider implementations MUST NOT introduce bespoke authentication protocols that bypass the contract abstractions declared in `@modelcontextprotocol/sdk`.

### Verify

```bash
# Discover and execute project build, test execution, and static analysis scripts covering authentication provider flows.
# Inspect the dependency lock artifact to confirm installed versions of @modelcontextprotocol/sdk match repository constraints.
```

**Accept when:**
- All automated authentication provider test suites pass without assertion failures.
- Static type analysis confirms zero type errors across modules importing `@modelcontextprotocol/sdk` authentication contracts.
- OAuth provider and client storage components strictly conform to the expected `@modelcontextprotocol/sdk` interface signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>