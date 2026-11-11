---
version: 2
name: cross-cutting-external-client-polling-requests-pass-8da5
description: "Polling Event Client Integration with event-types Module: External Client Polling Requests Pass Authorization"
metadata:
  actual:
    adr_id: 8da58270-6c22-46e9-8cc8-c92c0fe29e87
    status: accepted
    candidate_group_id: d6b817ed-9fc0-4473-a594-c5e736f863a4
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Polling Event Client Integration with event-types Module: External Client Polling Requests Pass Authorization

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for integration adapters and external client boundaries that ingest remote state updates via cursor-based HTTP polling, and event emitter services translating remote REST endpoint records into domain event streams.

### Rules

- **R-ADR-001** MUST: External client polling requests MUST pass authorization credentials via standard authorization request headers.

### Verify

```bash
# Discover and execute the project integration test suite targeting the polling event adapter
# Discover and execute static type checking and linting tasks defined in workspace scripts
```

**Accept when:**
- Integration tests confirm that external fetch invocations correctly update cursor query parameters and trigger expected event emissions.
- Static analysis and test suites pass with zero errors across all boundary adapters.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>