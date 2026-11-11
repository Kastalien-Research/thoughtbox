---
version: 2
name: cross-cutting-transformation-functions-that-map-transp-dced
description: "Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: Transformation Functions That Map Transport Payloads"
metadata:
  actual:
    adr_id: dced0ca3-6c55-4682-b92a-9705eb212bd3
    status: accepted
    candidate_group_id: 2db4b97d-6534-4d0f-80ab-e590c47bfabd
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/components/**
      - src/lib/session/**
---

# Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: Transformation Functions That Map Transport Payloads

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SESS-001** SHOULD: Transformation functions that map transport payloads or telemetry entries into presentation structures SHOULD be co-located with or exported through dedicated session domain adapter utilities.

### Verify

```bash
# Discover and execute workspace static analysis and type checking scripts to verify canonical session view-model imports and contract conformity.
```

**Accept when:**
- All session exploration, timeline, table, and formatter modules resolve their presentation types from the canonical view-model module without type errors.
- No UI component directly imports or consumes raw database models or telemetry payload definitions within presentation views.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks, peer code review, and type contract validations are mandatory.
</enforcement>