---
version: 2
name: cross-cutting-event-transport-clients-decode-incoming-3283
description: "Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Transport Clients Decode Incoming Payloads"
metadata:
  actual:
    adr_id: 32832873-0393-405b-a7e1-12fa957fc3f7
    status: accepted
    candidate_group_id: 93ae00ee-4c65-4887-906a-790458852c2d
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Transport Clients Decode Incoming Payloads

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for event ingestion transport clients utilizing streaming or polling mechanisms, and event filtering, routing, and dispatch components operating within the client plugin subsystem.

### Rules

- **R-ETD-001** MUST: Event transport clients MUST decode incoming payloads into typed event objects conforming to the event-types contract before passing them to internal emitters or filtering logic.

### Verify

```bash
# Discover and execute the project static type verification suite to validate event type compliance
# Discover and run the project test suite covering event ingestion clients and filtering adapters
```

**Accept when:**
- All event transport clients and event filtering modules resolve event data structures from the internal event-types module without type errors
- Static type verification and contract testing suites pass without unvalidated event payload accesses across streaming and polling ingestion pathways

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis, type verification checks, and peer architectural reviews are mandatory.
</enforcement>