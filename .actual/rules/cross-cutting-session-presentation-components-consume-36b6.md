---
version: 2
name: cross-cutting-session-presentation-components-consume-36b6
description: "Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Session Presentation Components Consume Badge Style"
metadata:
  actual:
    adr_id: 36b6973a-3e11-4084-8085-f3568a3a5aa8
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

# Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Session Presentation Components Consume Badge Style

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SESSION-001** SHOULD: Session presentation components SHOULD consume badge style tokens alongside `@/lib/session/view-models` to isolate rendering concerns from raw session data models.
- **R-SESSION-002** MANDATORY: Define all session badge color variants, border treatments, and sizing tokens within the centralized badge style module as exported constants or functions.
- **R-SESSION-003** MANDATORY: Pair badge style consumption with session view-models to ensure badges reflect normalized session state rather than raw payload properties.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>