---
version: 2
name: cross-cutting-route-repository-timeline-data-modeling-af1f
description: "Centralizing Repository Timeline Processing via the @/lib/repo/timeline Module: Route Repository Timeline Data Modeling Aggregation"
metadata:
  actual:
    adr_id: af1f2fdc-942b-4363-aeb3-6d7d3cfbe455
    status: accepted
    candidate_group_id: 35377cfb-bd4a-4feb-b920-dd5c46bc2657
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Centralizing Repository Timeline Processing via the @/lib/repo/timeline Module: Route Repository Timeline Data Modeling Aggregation

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all application components, route handlers, and presentation views responsible for processing or displaying repository timeline data.

### Rules

- **R-REPO-001** MUST: Route all repository timeline data modeling, aggregation, and parsing through the @/lib/repo/timeline module across server and client rendering boundaries.

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
Claude Code MUST NOT skip or defer verification. All pull requests introducing direct timeline parsing outside the designated module will be rejected.
</enforcement>