---
version: 2
name: cross-cutting-before-introducing-modifying-versioned-e-04ea
description: "Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: Before Introducing Modifying Versioned External Dependencies"
metadata:
  actual:
    adr_id: 04ea2bae-2982-48b3-8504-9dfa5fe1449b
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

# Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: Before Introducing Modifying Versioned External Dependencies

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SESSION-001** MUST: Before introducing or modifying versioned external dependencies that interact with session view modeling, the consumer MUST inspect the repository lock or resolution artifact to confirm compatibility with the exact resolved version.

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