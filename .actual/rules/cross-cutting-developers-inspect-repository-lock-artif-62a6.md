---
version: 2
name: cross-cutting-developers-inspect-repository-lock-artif-62a6
description: "@modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Developers Inspect Repository Lock Artifact Determine"
metadata:
  actual:
    adr_id: 62a63bf1-e465-4796-848a-4ec001e8157c
    status: accepted
    candidate_group_id: 09b5534b-924c-4513-ba14-ce50de217165
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Developers Inspect Repository Lock Artifact Determine

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MCO-001** MUST: Developers MUST inspect the repository lock artifact to determine the exact resolved version of @modelcontextprotocol/sdk and verify that all invoked server capabilities exist in that resolved version prior to implementation.

### Verify

```bash
# Discover and execute repository build script
# Discover and execute test suite covering event client polling and server channel dispatching
# Discover and execute static analysis/linting script
```

**Accept when:**
- All integration tests exercising Model Context Protocol server initialization, stdio transport connection, and event dispatching execute cleanly without errors.
- The repository static type checking and linting processes complete with zero diagnostics across all integration modules.
- Event polling routines correctly advance cursor parameters and emit structured events without dropped payloads or unhandled rejections during simulated transport latency.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated integration test suites and peer code reviews. Violations (such as custom real-time socket listeners, unhandled server process crashes, or secret token exposure) must be rejected or treated as critical defects.
</enforcement>