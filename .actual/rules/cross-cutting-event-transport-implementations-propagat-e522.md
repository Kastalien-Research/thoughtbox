---
version: 2
name: cross-cutting-event-transport-implementations-propagat-e522
description: "Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Transport Implementations Propagate Session Identifiers"
metadata:
  actual:
    adr_id: e522fe2c-df5e-4e12-8e69-010cf23b77f4
    status: accepted
    candidate_group_id: 93ae00ee-4c65-4887-906a-790458852c2d
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Transport Implementations Propagate Session Identifiers

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for event transport implementations, streaming and polling clients, event filtering components, and event processing pipelines operating within the client plugin subsystem.

### Rules

- **R-EVT-001** SHOULD: Event transport implementations SHOULD propagate session identifiers extracted from client configuration consistently across query parameters and event payloads.
- **R-EVT-002** MANDATORY: When introducing new event categories or modifying payload attributes, update the internal event-types module before consuming new structures in transport clients.
- **R-EVT-003** MANDATORY: Ensure transport clients decode incoming serialized payloads into typed representations defined by the event-types module prior to event emission.

### Verify

```bash
# Discover and execute the project static type verification suite to validate event type compliance
# Discover and run the project test suite covering event ingestion clients and filtering adapters
```

**Accept when:**
- All event transport clients and event filtering modules resolve event data structures from the internal event-types module without type errors
- Static type verification and contract testing suites pass without unvalidated event payload accesses across streaming and polling ingestion pathways

<enforcement>
Claude Code MUST NOT skip or defer verification. Builds that define local duplicate event types or consume untyped event payloads will fail verification, and pull requests containing ungrounded event interfaces must be refactored to consume the internal event-types module.
</enforcement>