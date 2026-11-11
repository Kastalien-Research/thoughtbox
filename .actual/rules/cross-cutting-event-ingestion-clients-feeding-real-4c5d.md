---
version: 2
name: cross-cutting-event-ingestion-clients-feeding-real-4c5d
description: "@modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Event Ingestion Clients Feeding Real Time"
metadata:
  actual:
    adr_id: 4c5d1d12-e881-4a17-bcea-75c7b06e4368
    status: accepted
    candidate_group_id: 09b5534b-924c-4513-ba14-ce50de217165
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Event Ingestion Clients Feeding Real Time

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for integration modules establishing real-time communication channels between host processes and external services, and background event clients responsible for polling remote endpoints and dispatching updates across process boundaries.

### Rules

- **R-EVENT-001** MUST: Event ingestion clients feeding real-time boundaries MUST maintain cursor state using incremental temporal parameters when polling external endpoints.

### Verify

```bash
# Discover and execute repository build script
build_script=$(npm pkg get scripts.build 2>/dev/null | tr -d '"')
if [ -n "$build_script" ] && [ "$build_script" != "null" ]; then
  npm run build
else
  echo "No build script found"
fi

# Discover and execute test suite
test_script=$(npm pkg get scripts.test 2>/dev/null | tr -d '"')
if [ -n "$test_script" ] && [ "$test_script" != "null" ]; then
  npm test
else
  echo "No test script found"
fi

# Discover and execute lint script
lint_script=$(npm pkg get scripts.lint 2>/dev/null | tr -d '"')
if [ -n "$lint_script" ] && [ "$lint_script" != "null" ]; then
  npm run lint
else
  echo "No lint script found"
fi
```

**Accept when:**
- All integration tests exercising Model Context Protocol server initialization, stdio transport connection, and event dispatching execute cleanly without errors.
- The repository static type checking and linting processes complete with zero diagnostics across all integration modules.
- Event polling routines correctly advance cursor parameters and emit structured events without dropped payloads or unhandled rejections during simulated transport latency.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated integration test suites and peer code reviews ensuring adherence to protocol server capability configuration and credential handling standards.
</enforcement>