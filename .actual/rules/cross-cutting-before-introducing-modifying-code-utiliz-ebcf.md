---
version: 2
name: cross-cutting-before-introducing-modifying-code-utiliz-ebcf
description: "Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Before Introducing Modifying Code Utilizing Modelcontextprotocol"
metadata:
  actual:
    adr_id: ebcf5065-d209-4187-9385-fc3c2794af33
    status: accepted
    candidate_group_id: d76778ae-1112-4ac9-b29f-9117c34b6f87
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Before Introducing Modifying Code Utilizing Modelcontextprotocol

Scope: applies to `src/auth/oauth/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MCP-001** MUST: Before introducing or modifying code utilizing `@modelcontextprotocol/sdk`, engineers MUST discover the dependency manifest and authoritative lock artifact to verify the exact resolved version against public API specifications.

### Verify

```bash
# 1. Discover dependency manifest, build tool, and lock artifact in the repository
# 2. Inspect the lock artifact to confirm installed versions of @modelcontextprotocol/sdk match constraints
# 3. Execute the project build and test execution scripts covering authentication provider flows
# 4. Execute project static analysis and type checking utilities to confirm conformance with SDK authentication interfaces
```

**Accept when:**
- All automated authentication provider test suites pass without assertion failures.
- Static type analysis confirms zero type errors across modules importing `@modelcontextprotocol/sdk` authentication contracts.
- OAuth provider and client storage components strictly conform to the expected `@modelcontextprotocol/sdk` interface signatures.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>