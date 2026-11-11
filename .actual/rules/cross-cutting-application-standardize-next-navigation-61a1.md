---
version: 2
name: cross-cutting-application-standardize-next-navigation-61a1
description: "next/navigation Module Adoption for Application Routing and URL State Management: Application Standardize Next Navigation Programmatic Routing"
metadata:
  actual:
    adr_id: 61a1d38f-2a68-45d6-8d5d-dc844f89a71d
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

# next/navigation Module Adoption for Application Routing and URL State Management: Application Standardize Next Navigation Programmatic Routing

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all application route pages, layout wrappers, navigation components, and server action modules requiring routing or URL state manipulation.

### Rules

- **R-NAV-001** MUST: The application MUST standardize on next/navigation for all programmatic routing, route parameter resolution, URL query manipulation, and redirect flows across server and client components.

### Verify

```bash
# Discover and run the project linting and static analysis script
# Discover and run the project type-checking script
# Discover and run the project automated test suite
```

**Accept when:**
- Static analysis confirms zero unauthorized routing imports or direct browser history mutations across the codebase.
- All navigation hook calls and redirect functions pass repository type-checking without diagnostic errors.
- Automated tests confirm route navigation and search parameter synchronization behave correctly across all views.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>