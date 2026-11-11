---
version: 2
name: cross-cutting-event-drop-notifications-that-recur-5021
description: "@modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Event Drop Notifications That Recur During"
metadata:
  actual:
    adr_id: 50213868-a0c4-4e0f-ace8-442213fdd841
    status: accepted
    candidate_group_id: 13e3836e-c533-4bcb-ad41-d53b76e25871
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Event Drop Notifications That Recur During

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all server components, event filters, and transport adapters participating in @modelcontextprotocol/sdk stdio communication sessions.

### Rules

- **R-MCP-001** SHOULD_NOT: Event drop notifications that recur during steady-state processing SHOULD NOT emit continuous standard error messages after the initial diagnostic notification.

### Verify

```bash
# Discover and execute the static analysis validation script from the project manifest
# to verify that no standard output logging invocations exist within channel server modules.
# (Consumer must derive project-specific command from repository manifest)

# Discover and execute the project test execution script from repository configuration
# to confirm that stdio transport integrity remains uncorrupted by diagnostic logging.
```

**Accept when:**
- Static analysis validates zero standard output logging calls within modules communicating over @modelcontextprotocol/sdk stdio transport.
- Test execution passes with all diagnostic, warning, and error outputs successfully directed to standard error.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis and peer code review verification must confirm zero unauthorized standard output statements in stdio modules.
</enforcement>