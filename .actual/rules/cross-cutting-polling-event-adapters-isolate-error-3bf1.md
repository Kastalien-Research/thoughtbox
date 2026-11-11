---
version: 2
name: cross-cutting-polling-event-adapters-isolate-error-3bf1
description: "Polling Event Client Integration with event-types Module: Polling Event Adapters Isolate Error Handling"
metadata:
  actual:
    adr_id: 3bf11ed3-6984-40ce-baea-c97e372db026
    status: accepted
    candidate_group_id: d6b817ed-9fc0-4473-a594-c5e736f863a4
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Polling Event Client Integration with event-types Module: Polling Event Adapters Isolate Error Handling

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for integration adapters and external client boundaries that ingest remote state updates via cursor-based HTTP polling and event emitter services translating remote REST endpoint records into domain event streams.

### Rules

- **R-POLL-001** SHOULD: Polling event adapters SHOULD isolate error handling during external fetch invocations to prevent ingestion failure from disrupting active event subscription listeners.
- **R-POLL-002** MANDATORY: Ensure cursor updates occur only after successful fetch responses and event emissions to prevent dropped events on failure.
- **R-POLL-003** MANDATORY: Configure authorization headers and session parameters via client configuration abstractions rather than hardcoded credentials.
- **R-POLL-004** MANDATORY: Discover the dependency manifest, identify the build tool, inspect the resolution artifact for exact resolved versions, look up official documentation, and confirm API existence before using versioned libraries.

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