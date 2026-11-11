---
version: 2
name: cross-cutting-domain-operations-tool-contracts-executi-e669
description: "Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Domain Operations Tool Contracts Execution Payloads"
metadata:
  actual:
    adr_id: e6694ea9-79c0-44e5-850e-5a56b9fe1242
    status: accepted
    candidate_group_id: 953639aa-abba-4411-9669-578c07237d35
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Domain Operations Tool Contracts Execution Payloads

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MCP-001** MUST: Domain operations, tool contracts, and execution payloads MUST use data types and interfaces imported directly from @modelcontextprotocol/sdk/types.js.

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