---
version: 2
name: cross-cutting-external-client-integration-adapters-pol-3452
description: "Polling Event Client Integration with event-types Module: External Client Integration Adapters Polling Remote"
metadata:
  actual:
    adr_id: 3452c24e-ce5a-4bc2-a550-3179e8f383a8
    status: accepted
    candidate_group_id: d6b817ed-9fc0-4473-a594-c5e736f863a4
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Polling Event Client Integration with event-types Module: External Client Integration Adapters Polling Remote

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for integration adapters and external client boundaries that ingest remote state updates via cursor-based HTTP polling and event emitter services translating remote REST endpoint records into domain event streams.

### Rules

- **R-EXT-001** MUST: External client integration adapters polling remote endpoints MUST emit events structured according to the internal event-types module contract via an event emitter rather than exposing raw HTTP polling interfaces to downstream domain consumers.

### Verify

```bash
# Discover and execute the project integration test suite targeting the polling event adapter to verify cursor progression and event emission.
# Discover and execute the static type checking and linting tasks defined in the workspace scripts to validate contract compliance with the event-types module.
```

**Accept when:**
- Integration tests confirm that external fetch invocations correctly update cursor query parameters and trigger expected event emissions.
- Static analysis and test suites pass with zero errors across all boundary adapters.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration pipeline executing unit and integration test suites, and by pull request architectural code reviews.
</enforcement>