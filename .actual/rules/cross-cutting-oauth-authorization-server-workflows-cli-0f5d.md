---
version: 2
name: cross-cutting-oauth-authorization-server-workflows-cli-0f5d
description: "Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Oauth Authorization Server Workflows Client Record"
metadata:
  actual:
    adr_id: 0f5dd077-b3df-4c0a-9b84-0e0a7c910190
    status: accepted
    candidate_group_id: d76778ae-1112-4ac9-b29f-9117c34b6f87
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Oauth Authorization Server Workflows Client Record

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-AUTH-001** MUST: OAuth authorization server workflows and client record management MUST standardize on `@modelcontextprotocol/sdk` authentication submodules for protocol-level identity and delegation contracts.

### Verify

```bash
# Discover and execute project build, test, static analysis, and lock artifact verification scripts from the repository configuration.
```

**Accept when:**
- All automated authentication provider test suites pass without assertion failures.
- Static type analysis confirms zero type errors across modules importing `@modelcontextprotocol/sdk` authentication contracts.
- OAuth provider and client storage components strictly conform to the expected `@modelcontextprotocol/sdk` interface signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks executing static type analysis and unit test suites, and peer code review.
</enforcement>