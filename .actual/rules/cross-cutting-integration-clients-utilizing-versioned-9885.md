---
version: 2
name: cross-cutting-integration-clients-utilizing-versioned-9885
description: "Polling Event Client Integration with event-types Module: Integration Clients Utilizing Versioned Runtime Network"
metadata:
  actual:
    adr_id: 98854e39-9585-404c-9d9f-fdcdf6373a8b
    status: accepted
    candidate_group_id: d6b817ed-9fc0-4473-a594-c5e736f863a4
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Polling Event Client Integration with event-types Module: Integration Clients Utilizing Versioned Runtime Network

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for integration adapters and external client boundaries that ingest remote state updates via cursor-based HTTP polling, and event emitter services translating remote REST endpoint records into domain event streams.

### Rules

- **R-INTEG-001** MUST: Integration clients utilizing versioned runtime or network dependencies MUST discover the workspace lock file and verify resolved dependency versions prior to establishing external boundary connections.

### Verify

```bash
# Discover and execute the project integration test suite targeting the polling event adapter
# Discover and execute static type checking and linting tasks defined in workspace scripts
```

**Accept when:**
- Integration tests confirm that external fetch invocations correctly update cursor query parameters and trigger expected event emissions.
- Static analysis and test suites pass with zero errors across all boundary adapters.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests must enforce encapsulation of polling logic and event-types contracts.
</enforcement>