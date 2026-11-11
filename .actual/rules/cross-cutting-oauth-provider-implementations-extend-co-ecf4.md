---
version: 2
name: cross-cutting-oauth-provider-implementations-extend-co-ecf4
description: "Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Oauth Provider Implementations Extend Consume Interfaces"
metadata:
  actual:
    adr_id: ecf45734-5025-453f-92d8-15822f6ab303
    status: accepted
    candidate_group_id: d76778ae-1112-4ac9-b29f-9117c34b6f87
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Oauth Provider Implementations Extend Consume Interfaces

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all authentication and authorization subsystems implementing OAuth server endpoints and client storage boundaries interfacing with Model Context Protocol consumers.

### Rules

- **R-MCP-001** MUST: OAuth provider implementations MUST extend or consume interfaces defined in `@modelcontextprotocol/sdk/server/auth/provider.js` and `@modelcontextprotocol/sdk/server/auth/types.js` to handle token dispatch, state validation, and client authorization callbacks.

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
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks executing static type analysis, unit test suites, and peer code review.
</enforcement>