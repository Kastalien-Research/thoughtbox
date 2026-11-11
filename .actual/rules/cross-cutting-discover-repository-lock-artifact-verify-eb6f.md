---
version: 2
name: cross-cutting-discover-repository-lock-artifact-verify-eb6f
description: "Centralizing Repository Timeline Processing via the @/lib/repo/timeline Module: Discover Repository Lock Artifact Verify Exact"
metadata:
  actual:
    adr_id: eb6fe023-cdbc-4896-8128-caacd3f75f5f
    status: accepted
    candidate_group_id: 35377cfb-bd4a-4feb-b920-dd5c46bc2657
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Centralizing Repository Timeline Processing via the @/lib/repo/timeline Module: Discover Repository Lock Artifact Verify Exact

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all application components, route handlers, and presentation views responsible for processing or displaying repository timeline data.

### Rules

- **R-TL-001** MUST: Discover the repository lock artifact and verify the exact resolved dependency versions before integrating or modifying versioned packages supporting timeline visualization.
- **R-TL-002** MUST: Ensure timeline module data transformation functions remain free of server-only or client-only side effects so they remain safely importable across all application tiers.
- **R-TL-003** MUST: Structure timeline graph data models into immutable data representations to facilitate client-side rendering optimization.

### Verify

```bash
# Discover and run the project repository static analysis script to verify module import constraints.
# Execute the repository test runner discovered from the dependency manifest to validate timeline computation behavior.
# Inspect the build resolution artifacts to verify that module imports resolve without circular dependencies.
```

**Accept when:**
- Static analysis validates that repository timeline operations import exclusively from the dedicated timeline module.
- Automated test suites pass without regressions across server and client timeline consumers.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated static analysis checks enforcing architectural import boundaries and peer code review during pull request evaluations.
</enforcement>