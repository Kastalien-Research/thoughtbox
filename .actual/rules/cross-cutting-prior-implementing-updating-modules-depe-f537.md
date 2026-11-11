---
version: 2
name: cross-cutting-prior-implementing-updating-modules-depe-f537
description: "@modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Prior Implementing Updating Modules Depending Modelcontextprotocol"
metadata:
  actual:
    adr_id: f537a0ff-32d9-44a8-b0ea-95ad79370ec3
    status: accepted
    candidate_group_id: 13e3836e-c533-4bcb-ad41-d53b76e25871
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Prior Implementing Updating Modules Depending Modelcontextprotocol

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all server components, event filters, and transport adapters participating in @modelcontextprotocol/sdk stdio communication sessions.

### Rules

- **R-MCP-001** MUST: Prior to implementing or updating modules depending on @modelcontextprotocol/sdk, the consumer MUST inspect the repository lock artifact to determine and verify the exact resolved dependency version.

### Verify

```bash
# Discover the static analysis validation script from the project manifest and execute it to verify standard output logging invocations
# Discover the project test execution script from the repository configuration and run tests
```

**Accept when:**
- Static analysis validates zero standard output logging calls within modules communicating over @modelcontextprotocol/sdk stdio transport.
- Test execution passes with all diagnostic, warning, and error outputs successfully directed to standard error.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>