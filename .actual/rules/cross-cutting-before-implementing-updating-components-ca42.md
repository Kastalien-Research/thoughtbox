---
version: 2
name: cross-cutting-before-implementing-updating-components-ca42
description: "Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Before Implementing Updating Components That Depend"
metadata:
  actual:
    adr_id: ca420bf3-43c7-4b7f-ae47-0f86701f58f7
    status: accepted
    candidate_group_id: 93ae00ee-4c65-4887-906a-790458852c2d
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Before Implementing Updating Components That Depend

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all event ingestion transport clients, event filtering, routing, and dispatch components operating within the client plugin subsystem.

### Rules

- **R-EVM-001** MUST: Before implementing or updating components that depend on external libraries, developers MUST inspect the repository lock artifact to determine the exact resolved dependency versions and verify API compatibility.
- **R-EVM-002** MUST: Update the internal event-types module before introducing new event categories or modifying payload attributes rather than consuming new structures in transport clients first.
- **R-EVM-003** MUST: Ensure transport clients decode incoming serialized payloads into typed representations defined by the event-types module prior to event emission.

### Verify

```bash
# Discover and execute the project static type verification suite to validate event type compliance
# Discover and run the project test suite covering event ingestion clients and filtering adapters
```

**Accept when:**
- All event transport clients and event filtering modules resolve event data structures from the internal event-types module without type errors.
- Static type verification and contract testing suites pass without unvalidated event payload accesses across streaming and polling ingestion pathways.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis, type verification checks, and peer architectural review are mandatory for all changes touching event transport clients, filtering modules, or event schemas.
</enforcement>