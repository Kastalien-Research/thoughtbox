---
version: 2
name: cross-cutting-isolate-view-model-transformations-sessi-adc7
description: "Next.js next/navigation Module Adoption: Isolate View Model Transformations Session Area"
metadata:
  actual:
    adr_id: adc79c8f-d9d1-4ce3-b88c-c1d80cf6d71d
    status: accepted
    candidate_group_id: 01c24c1f-9c07-493b-9d67-f8e6a4576b6a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Next.js next/navigation Module Adoption: Isolate View Model Transformations Session Area

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for application route page components requiring route segment resolution, redirects, and client navigation transitions, and presentation components embedded within route segments that interact with navigation state.

### Rules

- **R-NAV-001** SHOULD: Isolate view-model transformations and session area presentation logic into dedicated component boundaries rather than coupling presentation state to route navigation hooks.
- **R-NAV-002** MANDATORY: Execute the LOCK-VERSION GROUNDING process (find dependency manifest, identify build tool, inspect lock/resolution artifact, look up official docs for that exact version, confirm APIs exist, re-run per dependency at point of use) before writing code that uses a versioned library.
- **R-NAV-003** MANDATORY: Encapsulate route parameter parsing and error handling at the route boundary before delegating data to child view models or presentation headers.
- **R-NAV-004** MANDATORY: Ensure navigation transitions coordinate with data client instances and preserve workspace context across nested session views.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated CI pipelines executing type checks and static linting rules against import declarations, alongside peer code reviews and architectural exception review processes.
</enforcement>