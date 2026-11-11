---
version: 2
name: cross-cutting-before-implementing-updating-navigation-a231
description: "next/navigation Module Adoption for Application Routing and URL State Management: Before Implementing Updating Navigation Modules Developers"
metadata:
  actual:
    adr_id: a23157e6-3386-44cc-b351-b7f606196425
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

# next/navigation Module Adoption for Application Routing and URL State Management: Before Implementing Updating Navigation Modules Developers

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all application route pages, layout wrappers, navigation components, and server action modules requiring routing or URL state manipulation.

### Rules

- **R-NAV-001** MUST: Before implementing or updating navigation modules, developers MUST inspect the repository lock artifact to verify the exact resolved version of the framework navigation library.

### Verify

```bash
# Discover and run the project linting and static analysis script to verify routing imports
npm run lint

# Discover and run the project type-checking script to confirm navigation hooks and parameters comply
npm run typecheck

# Discover and run the automated test suite to ensure navigation transitions and query parameters function
npm test
```

**Accept when:**
- Static analysis confirms zero unauthorized routing imports or direct browser history mutations across the codebase.
- All navigation hook calls and redirect functions pass repository type-checking without diagnostic errors.
- Automated tests confirm route navigation and search parameter synchronization behave correctly across all views.

<enforcement>
Claude Code MUST NOT skip or defer verification. All navigation modifications must strictly adhere to lock-version grounding, approved framework routing modules, and pass all static analysis, type checking, and test suites prior to merge.
</enforcement>