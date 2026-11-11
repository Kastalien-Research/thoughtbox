---
version: 2
name: cross-cutting-interactive-components-that-inspect-upda-747d
description: "next/navigation Module Adoption for Application Routing and URL State Management: Interactive Components That Inspect Update Url"
metadata:
  actual:
    adr_id: 747dde56-69c4-4da2-87f9-6e939e860e25
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

# next/navigation Module Adoption for Application Routing and URL State Management: Interactive Components That Inspect Update Url

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`, `apps/web/src/lib/stripe/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NAV-001** MUST: Interactive components that inspect or update URL query parameters MUST utilize the search parameter hooks and utilities provided by next/navigation.

### Verify

```bash
# Discover and run the project linting and static analysis script to verify that routing imports strictly use the approved navigation module.
# Discover and run the project type-checking script to confirm navigation hooks and parameters comply with framework type definitions.
# Discover and run the project automated test suite to ensure navigation transitions, redirects, and query parameters function as expected.
```

**Accept when:**
- Static analysis confirms zero unauthorized routing imports or direct browser history mutations across the codebase.
- All navigation hook calls and redirect functions pass repository type-checking without diagnostic errors.
- Automated tests confirm route navigation and search parameter synchronization behave correctly across all views.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>