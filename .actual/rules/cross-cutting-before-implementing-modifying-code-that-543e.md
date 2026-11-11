---
version: 2
name: cross-cutting-before-implementing-modifying-code-that-543e
description: "Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Before Implementing Modifying Code That References"
metadata:
  actual:
    adr_id: 543eefce-6c5a-4fa7-8d09-6be210a86ab6
    status: accepted
    candidate_group_id: 953639aa-abba-4411-9669-578c07237d35
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Before Implementing Modifying Code That References

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all components implementing protocol server endpoints, tool handlers, session operations, branch operations, and task storage, as well as all domain modules serializing or deserializing protocol payloads and messages.

### Rules

- **R-MCP-001** MUST: Before implementing or modifying code that references @modelcontextprotocol/sdk, consumers MUST inspect the repository lock artifact to determine the exact resolved dependency version and confirm API availability against official documentation for that resolved version.

### Verify

```bash
grep -rn "@modelcontextprotocol/sdk" .
# Discover and execute the project typecheck command from the repository manifest to verify protocol type compliance
# Discover and execute the project test suite from the repository manifest to verify protocol server handlers and operation endpoints
```

**Accept when:**
- All protocol server handlers, operations, and task stores import types and runtime interfaces directly from @modelcontextprotocol/sdk.
- The discovered repository typecheck and test verification suites execute without compilation or runtime errors.
- No duplicate or parallel protocol message interfaces exist outside the official SDK type definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>