---
version: 2
name: cross-cutting-operational-diagnostic-event-filtering-e-171b
description: "@modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Operational Diagnostic Event Filtering Error Output"
metadata:
  actual:
    adr_id: 171b3301-6cb2-4416-91c3-93fa55fc2063
    status: accepted
    candidate_group_id: 13e3836e-c533-4bcb-ad41-d53b76e25871
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Operational Diagnostic Event Filtering Error Output

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MCP-001** MUST: All operational, diagnostic, event-filtering, and error output produced within components communicating via @modelcontextprotocol/sdk stdio server transports MUST be directed to the standard error stream using console.error.

### Verify

```bash
# Discover and run the static analysis validation script from the project manifest
# Example: npm run lint / cargo clippy / etc. per project setup
# Discover and run the project test execution script from repository configuration
# Example: npm test / cargo test / etc. per project setup
```

**Accept when:**
- Static analysis validates zero standard output logging calls within modules communicating over @modelcontextprotocol/sdk stdio transport.
- Test execution passes with all diagnostic, warning, and error outputs successfully directed to standard error.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>