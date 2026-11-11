---
version: 2
name: cross-cutting-diagnostic-messages-emitted-standard-err-fcb4
description: "@modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Diagnostic Messages Emitted Standard Error Include"
metadata:
  actual:
    adr_id: fcb49f6f-6c43-4c37-a446-518a4d600c97
    status: accepted
    candidate_group_id: 13e3836e-c533-4bcb-ad41-d53b76e25871
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Diagnostic Messages Emitted Standard Error Include

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MCP-001** SHOULD: Diagnostic messages emitted to standard error SHOULD include a consistent component identifier prefix to distinguish channel operational logs from runtime output.

### Verify

```bash
# Discover the static analysis validation script from the project manifest and execute it
# Discover the project test execution script from the repository configuration and run the test suite
```

**Accept when:**
- Static analysis validates zero standard output logging calls within modules communicating over @modelcontextprotocol/sdk stdio transport.
- Test execution passes with all diagnostic, warning, and error outputs successfully directed to standard error.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>