---
version: 2
name: cross-cutting-declarative-navigational-transitions-coo-d3c5
description: "next/navigation Module Adoption for Application Routing and URL State Management: Declarative Navigational Transitions Coordinate Through Framework"
metadata:
  actual:
    adr_id: d3c50840-041f-47f8-b289-a392922f7c54
    status: accepted
    candidate_group_id: 00700bca-1300-47f6-8aa1-84178082f0b8
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/components/**
      - src/lib/stripe/**
---

# next/navigation Module Adoption for Application Routing and URL State Management: Declarative Navigational Transitions Coordinate Through Framework

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all application route pages, layout wrappers, navigation components, server action modules, and interactive client components requiring routing or URL state manipulation.

### Rules

- **R-NAV-001** SHOULD: Declarative navigational transitions coordinate through framework link components while reserving next/navigation programmatic calls for imperative workflows.
- **R-NAV-002** MUST: Execute lock-version grounding before writing code that uses a versioned library: find dependency manifest, identify build tool, inspect lock/resolution artifact, look up official documentation for that exact version, confirm every API/class/function exists in that version, and re-run per dependency at point of use for version-sensitive behavior.
- **R-NAV-003** MUST: Wrap client search parameter readers in appropriate boundary wrappers and isolate URL state reads to designated consumer components.
- **R-NAV-004** MUST: Compose search parameter mutations using standard URL search parameter primitives before triggering navigation updates.
- **R-NAV-005** MUST: Organize server action redirection so that navigation transitions occur after successful database operations and validations.

### Verify

```bash
# Discover and run the project linting and static analysis script to verify routing imports
npm run lint

# Discover and run the project type-checking script to confirm navigation hooks and parameters comply with framework type definitions
npm run type-check

# Discover and run the project automated test suite to ensure navigation transitions, redirects, and query parameters function as expected
npm test
```

**Accept when:**
- Static analysis confirms zero unauthorized routing imports or direct browser history mutations across the codebase.
- All navigation hook calls and redirect functions pass repository type-checking without diagnostic errors.
- Automated tests confirm route navigation and search parameter synchronization behave correctly across all views.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration lint checks, static import verification rules, and peer code reviews.
</enforcement>