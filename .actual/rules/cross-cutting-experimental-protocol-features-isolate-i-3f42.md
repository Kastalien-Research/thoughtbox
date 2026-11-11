---
version: 2
name: cross-cutting-experimental-protocol-features-isolate-i-3f42
description: "Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Experimental Protocol Features Isolate Imports Dedicated"
metadata:
  actual:
    adr_id: 3f42a248-d6b1-4008-ac5c-13d96f2b1535
    status: accepted
    candidate_group_id: 953639aa-abba-4411-9669-578c07237d35
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Experimental Protocol Features Isolate Imports Dedicated

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MCP-001** SHOULD: Experimental protocol features MUST isolate imports to dedicated experimental subpaths such as @modelcontextprotocol/sdk/experimental/tasks/interfaces.js and guard their usage from stable server operations.

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