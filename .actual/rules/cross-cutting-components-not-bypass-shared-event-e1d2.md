---
version: 2
name: cross-cutting-components-not-bypass-shared-event-e1d2
description: "Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Components Not Bypass Shared Event Types"
metadata:
  actual:
    adr_id: e1d2d044-b08a-44f1-887a-c6c6060d54ee
    status: accepted
    candidate_group_id: 93ae00ee-4c65-4887-906a-790458852c2d
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Components Not Bypass Shared Event Types

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EVM-001** MUST_NOT: Components MUST NOT bypass the shared event-types definitions by using untyped or arbitrary record structures when emitting or filtering domain events.

### Verify

```bash
# Discover and execute the project static type verification suite to validate event type compliance
# Discover and run the project test suite covering event ingestion clients and filtering adapters
```

**Accept when:**
- All event transport clients and event filtering modules resolve event data structures from the internal event-types module without type errors
- Static type verification and contract testing suites pass without unvalidated event payload accesses across streaming and polling ingestion pathways

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>