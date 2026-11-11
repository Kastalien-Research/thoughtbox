---
version: 2
name: cross-cutting-not-implement-bespoke-navigation-abstrac-b40b
description: "Next.js next/navigation Module Adoption: Not Implement Bespoke Navigation Abstractions Direct"
metadata:
  actual:
    adr_id: b40b9d3f-f22f-4f98-bd87-e5ccb6911277
    status: accepted
    candidate_group_id: 01c24c1f-9c07-493b-9d67-f8e6a4576b6a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Next.js next/navigation Module Adoption: Not Implement Bespoke Navigation Abstractions Direct

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all application route page components requiring route segment resolution, redirects, and client navigation transitions, and presentation components embedded within route segments that interact with navigation state.

### Rules

- **R-NAV-001** MUST_NOT: MUST NOT implement bespoke navigation abstractions or direct window location manipulations when navigation primitives from next/navigation are available.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration pipelines, type checks, static linting rules, and peer code review.
</enforcement>