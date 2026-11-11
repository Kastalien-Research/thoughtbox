---
version: 2
name: cross-cutting-polling-adapters-maintain-cursor-state-b734
description: "Polling Event Client Integration with event-types Module: Polling Adapters Maintain Cursor State Query"
metadata:
  actual:
    adr_id: b734bdd0-f4b1-4bbc-bf41-5ec817be5381
    status: accepted
    candidate_group_id: d6b817ed-9fc0-4473-a594-c5e736f863a4
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Polling Event Client Integration with event-types Module: Polling Adapters Maintain Cursor State Query

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for integration adapters and external client boundaries that ingest remote state updates via cursor-based HTTP polling, and event emitter services translating remote REST endpoint records into domain event streams.

### Rules

- **R-POLL-001** MUST: Polling adapters MUST maintain cursor state using query parameters, including changed-since timestamp or sequential cursor, session identifier, and page limit constraints on external fetch requests.

### Verify

```bash
# Discover and execute the project integration test suite targeting the polling event adapter to verify cursor progression and event emission.
# Discover and execute the static type checking and linting tasks defined in the workspace scripts to validate contract compliance with the event-types module.
```

**Accept when:**
- Integration tests confirm that external fetch invocations correctly update cursor query parameters and trigger expected event emissions.
- Static analysis and test suites pass with zero errors across all boundary adapters.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>