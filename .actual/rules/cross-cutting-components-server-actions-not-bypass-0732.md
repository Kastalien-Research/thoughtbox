---
version: 2
name: cross-cutting-components-server-actions-not-bypass-0732
description: "next/navigation Module Adoption for Application Routing and URL State Management: Components Server Actions Not Bypass Next"
metadata:
  actual:
    adr_id: 0732eff9-b9b7-4420-b825-c09a72430fd8
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

# next/navigation Module Adoption for Application Routing and URL State Management: Components Server Actions Not Bypass Next

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all application route pages, layout wrappers, navigation components, and server action modules requiring routing, URL state manipulation, or redirection.

### Rules

- **R-NAV-001** MUST_NOT: Components and server actions MUST_NOT bypass next/navigation by mutating or reading raw browser window navigation APIs or importing superseded navigation packages.

### Verify

```bash
# Discover and run the project linting and static analysis script to verify routing imports
npm run lint

# Discover and run the project type-checking script to confirm navigation types
npm run type-check

# Discover and run the project automated test suite to ensure navigation transitions work
npm test
```

**Accept when:**
- Static analysis confirms zero unauthorized routing imports or direct browser history mutations across the codebase.
- All navigation hook calls and redirect functions pass repository type-checking without diagnostic errors.
- Automated tests confirm route navigation and search parameter synchronization behave correctly across all views.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory for all changes affecting routing, server actions, or URL state management.
</enforcement>