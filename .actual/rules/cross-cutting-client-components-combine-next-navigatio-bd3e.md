---
version: 2
name: cross-cutting-client-components-combine-next-navigatio-bd3e
description: "next/navigation Module Adoption for Application Routing and URL State Management: Client Components Combine Next Navigation Search"
metadata:
  actual:
    adr_id: bd3eaa7c-11a2-4a8f-8098-ea8048c1d7ce
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

# next/navigation Module Adoption for Application Routing and URL State Management: Client Components Combine Next Navigation Search

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all application route pages, layout wrappers, navigation components, and server action modules requiring routing or URL state manipulation.

### Rules

- **R-NAV-001** MAY: Client components MAY combine next/navigation search parameter state with local component state hooks to handle immediate transient interface updates.

### Verify

```bash
# Discover and run the project linting and static analysis script to verify routing imports
npm run lint
# Discover and run the project type-checking script to confirm navigation hooks and parameters
npm run typecheck
# Discover and run the project automated test suite
npm test
```

**Accept when:**
- Static analysis confirms zero unauthorized routing imports or direct browser history mutations across the codebase.
- All navigation hook calls and redirect functions pass repository type-checking without diagnostic errors.
- Automated tests confirm route navigation and search parameter synchronization behave correctly across all views.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration lint checks, static import verification rules, and peer code review.
</enforcement>