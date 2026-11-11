---
version: 2
name: cross-cutting-export-utilities-rendering-badge-represe-c3c5
description: "Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Export Utilities Rendering Badge Representations Coordinate"
metadata:
  actual:
    adr_id: c3c521c1-dd9e-4445-a2e4-ac2e1f5193a9
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

# Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Export Utilities Rendering Badge Representations Coordinate

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all session presentation components, export formatters, and workspace dashboard views rendering session metadata badges.

### Rules

- **R-SESSION-001** MUST: Export utilities rendering badge representations MUST coordinate badge formatting with the `@/lib/session/badge-styles` module to maintain visual and textual parity with presentation components.

### Verify

```bash
# Inspect project configuration to discover static analysis script and execute it to verify badge styling module imports
npm run lint

# Discover repository test runner and execute component test suite to confirm badge rendering conformity
npm test

# Run type validation script to ensure type safety of imported badge style tokens
npm run typecheck
```

**Accept when:**
- Static analysis confirms all session badge rendering components import styling exclusively from the centralized badge style module without undeclared styling duplicates.
- All unit and component tests verifying session badge rendering pass without errors.
- Type checking passes with zero diagnostics across all modules consuming badge styling definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration checks executing static analysis and type validation on pull requests, alongside peer code review.
</enforcement>