---
version: 2
name: cross-cutting-integration-boundary-implement-real-time-a773
description: "@modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Integration Boundary Implement Real Time Client"
metadata:
  actual:
    adr_id: a773a0b4-770f-405b-8697-9a8aa2b72826
    status: accepted
    candidate_group_id: 09b5534b-924c-4513-ba14-ce50de217165
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Integration Boundary Implement Real Time Client

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all integration modules establishing real-time communication channels and background event clients.

### Rules

- **R-MCP-001** MUST: The integration boundary MUST implement real-time client communication channels using @modelcontextprotocol/sdk Server instances configured with standard input/output transport.

### Verify

```bash
# Discover and execute the repository build script from the dependency manifest
# Discover and run the automated test suite covering event client polling and server channel dispatching
# Execute repository static analysis/linting scripts
```

**Accept when:**
- All integration tests exercising Model Context Protocol server initialization, stdio transport connection, and event dispatching execute cleanly without errors.
- The repository static type checking and linting processes complete with zero diagnostics across all integration modules.
- Event polling routines correctly advance cursor parameters and emit structured events without dropped payloads or unhandled rejections during simulated transport latency.

<enforcement>
Verification is mandatory. Claude Code MUST NOT skip or defer verification.
</enforcement>