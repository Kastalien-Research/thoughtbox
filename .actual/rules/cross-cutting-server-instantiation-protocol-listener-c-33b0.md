---
version: 2
name: cross-cutting-server-instantiation-protocol-listener-c-33b0
description: "Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Server Instantiation Protocol Listener Configuration Use"
metadata:
  actual:
    adr_id: 33b0be7a-3841-4f84-9e6d-5afe86159726
    status: accepted
    candidate_group_id: 953639aa-abba-4411-9669-578c07237d35
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Server Instantiation Protocol Listener Configuration Use

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all components implementing protocol server endpoints, tool handlers, session operations, branch operations, and task storage, and all domain modules serializing or deserializing protocol payloads and messages.

### Rules

- **R-MCP-001** MUST: Server instantiation and protocol listener configuration MUST use the server primitives provided by @modelcontextprotocol/sdk/server/mcp.js rather than custom transport wrappers.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>