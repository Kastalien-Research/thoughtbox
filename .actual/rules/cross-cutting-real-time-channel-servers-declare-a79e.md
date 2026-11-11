---
version: 2
name: cross-cutting-real-time-channel-servers-declare-a79e
description: "@modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Real Time Channel Servers Declare Claude"
metadata:
  actual:
    adr_id: a79e894c-4522-4550-b5fa-f988e100a427
    status: accepted
    candidate_group_id: 09b5534b-924c-4513-ba14-ce50de217165
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Real Time Channel Servers Declare Claude

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MCP-001** MUST: Real-time channel servers MUST declare claude/channel under the capabilities.experimental configuration object during Server initialization.

### Verify

```bash
# Discover the repository build script from the dependency manifest and execute it
# Discover the test execution script and run the automated test suite
# Inspect the static analysis configuration and execute the repository linting script
```

**Accept when:**
- All integration tests exercising Model Context Protocol server initialization, stdio transport connection, and event dispatching execute cleanly without errors.
- The repository static type checking and linting processes complete with zero diagnostics across all integration modules.
- Event polling routines correctly advance cursor parameters and emit structured events without dropped payloads or unhandled rejections during simulated transport latency.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>