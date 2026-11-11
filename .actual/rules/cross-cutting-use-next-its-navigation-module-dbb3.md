---
version: 2
name: cross-cutting-use-next-its-navigation-module-dbb3
description: "Next.js next/navigation Module Adoption: Use Next Its Navigation Module Standard"
metadata:
  actual:
    adr_id: dbb321b8-f6a4-4bc8-b35e-d77c3cc6e982
    status: accepted
    candidate_group_id: 01c24c1f-9c07-493b-9d67-f8e6a4576b6a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Next.js next/navigation Module Adoption: Use Next Its Navigation Module Standard

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all application route page components, presentation components interacting with navigation state, and related web presentation layer files matching the configured scope.

### Rules

- **R-NAV-001** MUST: Use Next.js and its `next/navigation` module as the standard routing and navigation interface across application route pages.
- **R-NAV-002** MANDATORY: Encapsulate route parameter parsing and error handling at the route boundary before delegating data to child view models or presentation headers.
- **R-NAV-003** MANDATORY: Ensure navigation transitions coordinate with data client instances and preserve workspace context across nested session views.
- **R-NAV-004** MANDATORY: Follow the Discovery Policy and Lock-Version Grounding process prior to writing code using versioned libraries.

### Verify

```bash
# Discover and execute the repository type-checking script
# Discover and run the project linter and static analysis suite
# Discover and execute the automated test runner
```

**Accept when:**
- Static type analysis passes with zero type errors across all route page components utilizing the navigation module.
- Linter and structural analysis confirm that navigation occurs exclusively through the authorized framework module.
- Integration test suites verify that route rendering and navigation parameter handling behave as expected without unhandled routing exceptions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration pipelines, static linting rules, and peer code review.
</enforcement>