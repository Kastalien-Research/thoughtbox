---
version: 2
name: cross-cutting-event-filtering-components-inspect-metad-a720
description: "Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Filtering Components Inspect Metadata Attributes"
metadata:
  actual:
    adr_id: a7208293-e0c6-4a34-8a1e-33235871ab0d
    status: accepted
    candidate_group_id: 93ae00ee-4c65-4887-906a-790458852c2d
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Filtering Components Inspect Metadata Attributes

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EVM-001** MUST: Event filtering components MUST inspect event metadata attributes defined in the shared event-types contract to determine whether an event requires session-based or workspace-wide routing.

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