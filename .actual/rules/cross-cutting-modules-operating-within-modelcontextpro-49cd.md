---
version: 2
name: cross-cutting-modules-operating-within-modelcontextpro-49cd
description: "@modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Modules Operating Within Modelcontextprotocol Sdk Stdio"
metadata:
  actual:
    adr_id: 49cd925c-4d93-4bba-a9ab-9f13129efd14
    status: accepted
    candidate_group_id: 13e3836e-c533-4bcb-ad41-d53b76e25871
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Modules Operating Within Modelcontextprotocol Sdk Stdio

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all server components, event filters, and transport adapters participating in @modelcontextprotocol/sdk stdio communication sessions.

### Rules

- **R-MCP-001** MUST_NOT: Modules operating within the @modelcontextprotocol/sdk stdio transport boundary MUST NOT emit diagnostic messages, warnings, or debug strings to standard output, reserving standard output exclusively for protocol framing.

### Verify

```bash
# Discover the static analysis validation script from the project manifest and execute it to verify standard output logging absence
# Discover the project test execution script from the repository configuration and run the test suite
```

**Accept when:**
- Static analysis validates zero standard output logging calls within modules communicating over @modelcontextprotocol/sdk stdio transport.
- Test execution passes with all diagnostic, warning, and error outputs successfully directed to standard error.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>