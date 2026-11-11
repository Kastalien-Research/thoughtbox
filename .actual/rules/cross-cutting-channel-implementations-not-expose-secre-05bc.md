---
version: 2
name: cross-cutting-channel-implementations-not-expose-secre-05bc
description: "@modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Channel Implementations Not Expose Secret Credentials"
metadata:
  actual:
    adr_id: 05bc38de-c277-4eb5-8d6b-2439a78762e9
    status: accepted
    candidate_group_id: 09b5534b-924c-4513-ba14-ce50de217165
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Channel Implementations Not Expose Secret Credentials

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CHAN-001** MUST_NOT: Channel implementations MUST NOT expose secret credentials or authorization tokens in event payloads or diagnostic logging streams.

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
Claude Code MUST NOT skip or defer verification. Automated integration test suites, peer code reviews, and static analysis enforce compliance.
</enforcement>