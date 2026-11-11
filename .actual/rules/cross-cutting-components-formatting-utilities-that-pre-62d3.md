---
version: 2
name: cross-cutting-components-formatting-utilities-that-pre-62d3
description: "Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Components Formatting Utilities That Present Export"
metadata:
  actual:
    adr_id: 62d3cb4a-6855-46aa-acc4-4144cef1b540
    status: accepted
    candidate_group_id: bfe6a831-5d4c-417b-b615-1691bf50b5a8
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/components/session-area/**
      - src/lib/session/**
---

# Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Components Formatting Utilities That Present Export

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all session presentation components, export formatters, and dashboard views rendering status indicators.

### Rules

- **R-BADGE-001** MUST: Components and formatting utilities that present or export session status badges MUST import styling definitions exclusively from the internal `@/lib/session/badge-styles` module.

### Verify

```bash
# Execute the project's static analysis script to verify badge styling module imports
npm run lint

# Run the project test suite to confirm badge rendering conformity
npm test

# Run type validation to ensure type safety of imported badge style tokens
npm run typecheck
```

**Accept when:**
- Static analysis confirms all session badge rendering components import styling exclusively from the centralized badge style module without undeclared styling duplicates.
- All unit and component tests verifying session badge rendering pass without errors.
- Type checking passes with zero diagnostics across all modules consuming badge styling definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks executing static analysis and type validation, alongside peer code review.
</enforcement>