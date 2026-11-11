---
version: 2
name: cross-cutting-domain-modules-not-declare-create-3b62
description: "Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Domain Modules Not Declare Create Duplicate"
metadata:
  actual:
    adr_id: 3b62da29-c513-4f43-ae3c-296cd83562a6
    status: accepted
    candidate_group_id: 953639aa-abba-4411-9669-578c07237d35
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Domain Modules Not Declare Create Duplicate

Scope: applies to `src/**`.

These rules are ALWAYS ACTIVE for all components implementing protocol server endpoints, tool handlers, session operations, branch operations, task storage, and domain modules serializing or deserializing protocol payloads and messages.

### Rules

- **R-MCP-001** MUST_NOT: Domain modules MUST NOT re-declare or create duplicate type definitions for protocol messages, tool specifications, or task contracts that are provided by @modelcontextprotocol/sdk.

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
Claude Code MUST NOT skip or defer verification. Automated continuous integration type-checking and test suite execution enforce compliance, and pull requests introducing custom protocol types or bypassing official SDK server primitives are blocked until refactored.
</enforcement>