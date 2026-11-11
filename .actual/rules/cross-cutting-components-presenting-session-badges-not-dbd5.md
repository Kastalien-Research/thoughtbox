---
version: 2
name: cross-cutting-components-presenting-session-badges-not-dbd5
description: "Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Components Presenting Session Badges Not Define"
metadata:
  actual:
    adr_id: dbd5be08-e7a3-41c1-9bfb-f05127fd61f0
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

# Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Components Presenting Session Badges Not Define

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all session presentation components, export formatting utilities, and workspace dashboard views rendering status indicators.

### Rules

- **R-SESSION-001** MUST_NOT: Components presenting session badges MUST NOT define ad-hoc visual class strings or inline badge styling rules outside the centralized `@/lib/session/badge-styles` module.

### Verify

```bash
# Inspect the project configuration to discover the static analysis script and execute it to verify imports of the badge styling module across session components.
# Discover the repository test runner from the project scripts and execute the component test suite to confirm badge rendering conformity.
# Run the project type validation script discovered from repository configuration to ensure type safety of imported badge style tokens.
```

**Accept when:**
- Static analysis confirms all session badge rendering components import styling exclusively from the centralized badge style module without undeclared styling duplicates.
- All unit and component tests verifying session badge rendering pass without errors.
- Type checking passes with zero diagnostics across all modules consuming badge styling definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks execute static analysis and type validation on pull requests.
</enforcement>