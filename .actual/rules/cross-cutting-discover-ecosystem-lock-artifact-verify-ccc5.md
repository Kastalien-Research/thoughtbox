---
version: 2
name: cross-cutting-discover-ecosystem-lock-artifact-verify-ccc5
description: "Next.js next/navigation Module Adoption: Discover Ecosystem Lock Artifact Verify Exact"
metadata:
  actual:
    adr_id: ccc5b9bb-5938-4a21-a4c0-42436776fca3
    status: accepted
    candidate_group_id: 01c24c1f-9c07-493b-9d67-f8e6a4576b6a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Next.js next/navigation Module Adoption: Discover Ecosystem Lock Artifact Verify Exact

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all application route page components and presentation components requiring route segment resolution, redirects, and client navigation transitions.

### Rules

- **R-NAV-001** MUST: Discover the ecosystem lock artifact and verify the exact resolved version of next before introducing or modifying navigation interfaces.

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
Claude Code MUST NOT skip or defer verification. All pull requests introducing unauthorized routing abstractions or non-standard navigation patterns are blocked.
</enforcement>