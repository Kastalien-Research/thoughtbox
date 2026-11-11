---
version: 2
name: cross-cutting-components-that-expose-protocol-server-1db5
description: "Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Components That Expose Protocol Server Endpoints"
metadata:
  actual:
    adr_id: 1db507bd-79cb-4cc8-bd25-193f0845abaf
    status: accepted
    candidate_group_id: 953639aa-abba-4411-9669-578c07237d35
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Components That Expose Protocol Server Endpoints

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all components implementing protocol server endpoints, tool handlers, session operations, branch operations, and task storage, as well as all domain modules serializing or deserializing protocol payloads and messages.

### Rules

- **R-MCP-001** MUST: Components that expose protocol server endpoints, session operations, branch workflows, or task persistence MUST adopt @modelcontextprotocol/sdk as the exclusive foundation for protocol types and server lifecycle management.
- **R-MCP-002** MUST: Import all core protocol data types directly from the designated types subpath of @modelcontextprotocol/sdk rather than defining parallel interface definitions.
- **R-MCP-003** MUST: Configure server runtime instances through the official server entry point of @modelcontextprotocol/sdk to maintain consistent lifecycle and error handling behaviors.

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