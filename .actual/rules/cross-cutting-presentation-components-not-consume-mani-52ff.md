---
version: 2
name: cross-cutting-presentation-components-not-consume-mani-52ff
description: "Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: Presentation Components Not Consume Manipulate Raw"
metadata:
  actual:
    adr_id: 52ffe4aa-b52a-4a8e-9824-79d2cdce3433
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

# Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: Presentation Components Not Consume Manipulate Raw

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SESS-001** MUST NOT: Presentation components MUST NOT consume or manipulate raw persistence or telemetry records directly when corresponding view models exist within the @/lib/session/view-models module.

### Verify

```bash
# Discover the workspace static analysis script and execute it to verify that session UI components import types from the canonical session view-model module.
# Discover and run the project type checking and contract validation script to ensure view-model interface conformity.
```

**Accept when:**
- All session exploration, timeline, table, and formatter modules resolve their presentation types from the canonical view-model module without type errors.
- No UI component directly imports or consumes raw database models or telemetry payload definitions within presentation views.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>