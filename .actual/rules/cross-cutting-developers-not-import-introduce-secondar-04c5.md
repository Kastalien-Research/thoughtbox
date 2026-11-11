---
version: 2
name: cross-cutting-developers-not-import-introduce-secondar-04c5
description: "date-fns Library Adoption for Temporal Operations: Developers Not Import Introduce Secondary Third"
metadata:
  actual:
    adr_id: 04c5977b-35cf-4b05-ad59-1a493380898e
    status: accepted
    candidate_group_id: 969dd436-fd3c-425e-8b4d-6e13c3009579
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/components/session-area/**
      - src/lib/session/**
---

# date-fns Library Adoption for Temporal Operations: Developers Not Import Introduce Secondary Third

Scope: applies to `apps/web/src/app/w/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/session/**`.

These rules are ALWAYS ACTIVE for all domain view models, data presentation mappers, server-side route pages rendering timeline or usage analytics, and interactive client components rendering localized timestamps or historical intervals.

### Rules

- **R-DATE-001** MUST_NOT: Developers MUST NOT import or introduce secondary third-party date or time manipulation libraries into the application dependency tree.
- **R-DATE-002** MUST: Ensure all imports from date-fns use named modular bindings to maximize tree-shaking efficiency in client bundles.
- **R-DATE-003** MUST: Encapsulate complex domain-specific temporal aggregations and lane assignments within dedicated domain view-model modules.
- **R-DATE-004** MUST: Follow lock-version grounding (inspecting manifest, build tool, and lock/resolution artifact) before writing code that uses a versioned library.

### Verify

```bash
# Discover and execute the project dependency analysis script to verify date-fns is the sole temporal library present in manifests.
# Discover and execute the repository linter to verify all date-fns imports utilize modular named specifiers.
# Discover and execute the automated test runner to ensure all temporal view-model transformations pass test suites.
```

**Accept when:**
- All temporal manipulation, formatting, and calculation functions import modular utilities from date-fns across client components, server pages, and domain view models.
- Static analysis and dependency verification pass with zero unapproved third-party temporal calculation libraries present in the dependency manifest.
- The exact installed version of date-fns matches the resolved version documented in the repository lock artifact.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated dependency scanning, import boundary linting, and peer reviews enforce these constraints.
</enforcement>