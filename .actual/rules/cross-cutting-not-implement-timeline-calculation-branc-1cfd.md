---
version: 2
name: cross-cutting-not-implement-timeline-calculation-branc-1cfd
description: "Centralizing Repository Timeline Processing via the @/lib/repo/timeline Module: Not Implement Timeline Calculation Branch Sorting"
metadata:
  actual:
    adr_id: 1cfd5350-a06d-4a30-b966-6db767f7f6ee
    status: accepted
    candidate_group_id: 35377cfb-bd4a-4feb-b920-dd5c46bc2657
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Centralizing Repository Timeline Processing via the @/lib/repo/timeline Module: Not Implement Timeline Calculation Branch Sorting

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TIMELINE-001** MUST_NOT: MUST NOT re-implement timeline calculation, branch sorting, or commit graph traversal algorithms inside presentation components or route handlers.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>