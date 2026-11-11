---
version: 2
name: cross-cutting-user-interface-components-formatting-uti-c5d1
description: "Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: User Interface Components Formatting Utilities Exploration"
metadata:
  actual:
    adr_id: c5d12e7f-a6f6-40bd-9b67-877d5e42f9d5
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

# Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: User Interface Components Formatting Utilities Exploration

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SESSION-001** MUST: All user interface components, formatting utilities, and exploration views within the session domain MUST import presentation types and structures exclusively from the @/lib/session/view-models module rather than defining ad-hoc representations.

### Verify

```bash
# Discover the workspace static analysis script and execute it to verify that session UI components import types from the canonical session view-model module.
# Discover and run the project type checking and contract validation script to ensure view-model interface conformity.
```

**Accept when:**
- All session exploration, timeline, table, and formatter modules resolve their presentation types from the canonical view-model module without type errors.
- No UI component directly imports or consumes raw database models or telemetry payload definitions within presentation views.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>