---
version: 2
name: cross-cutting-developers-inspect-repository-dependency-b3f2
description: "Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Developers Inspect Repository Dependency Lock Artifact"
metadata:
  actual:
    adr_id: b3f2aaf7-9d47-418a-acec-f74ae6723ce2
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

# Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Developers Inspect Repository Dependency Lock Artifact

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all session presentation components, export formatters, and workspace dashboard views rendering session metadata badges.

### Rules

- **R-SESSION-001** MUST: Developers MUST inspect the repository dependency lock artifact to resolve the exact locked versions of all supporting libraries before introducing new external dependencies into the session domain.

### Verify

```bash
# Discover and execute the project's static analysis script to verify badge styling module imports
npm run lint || pnpm lint || yarn lint

# Discover and execute the project test runner for component test suite
npm test || pnpm test || yarn test

# Discover and execute type validation script
npm run typecheck || pnpm typecheck || yarn typecheck
```

**Accept when:**
- Static analysis confirms all session badge rendering components import styling exclusively from the centralized badge style module without undeclared styling duplicates.
- All unit and component tests verifying session badge rendering pass without errors.
- Type checking passes with zero diagnostics across all modules consuming badge styling definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks execute static analysis, type validation, and test suites on pull requests, and peer code reviews verify adherence.
</enforcement>