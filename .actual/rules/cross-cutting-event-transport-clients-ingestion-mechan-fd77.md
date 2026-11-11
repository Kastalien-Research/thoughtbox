---
version: 2
name: cross-cutting-event-transport-clients-ingestion-mechan-fd77
description: "Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Transport Clients Ingestion Mechanisms Filtering"
metadata:
  actual:
    adr_id: fd7729ae-30a0-4688-b8a1-a736780503f2
    status: accepted
    candidate_group_id: 93ae00ee-4c65-4887-906a-790458852c2d
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Transport Clients Ingestion Mechanisms Filtering

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-EVM-001** MUST: All event transport clients, event ingestion mechanisms, and event filtering components MUST import their domain event interfaces and schema contracts directly from the internal event-types module rather than declaring local event interfaces.

### Verify

```bash
# Discover and execute the project static type verification suite to validate event type compliance
# Discover and run the project test suite covering event ingestion clients and filtering adapters
```

**Accept when:**
- All event transport clients and event filtering modules resolve event data structures from the internal event-types module without type errors
- Static type verification and contract testing suites pass without unvalidated event payload accesses across streaming and polling ingestion pathways

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests and code modifications touching event transport clients, filtering modules, or event schemas must comply with the internal event-types module requirement, verified by automated static analysis and peer architectural review.
</enforcement>