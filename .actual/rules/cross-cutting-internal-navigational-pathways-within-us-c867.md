---
version: 2
name: cross-cutting-internal-navigational-pathways-within-us-c867
description: "Next.js next/link Navigation Module Adoption: Internal Navigational Pathways Within User Interface"
metadata:
  actual:
    adr_id: c8676179-7330-4a26-8c43-dfbf9d001355
    status: accepted
    candidate_group_id: 06fb8bae-c34c-430e-b9ad-4426b83ecdc4
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/components/**
---

# Next.js next/link Navigation Module Adoption: Internal Navigational Pathways Within User Interface

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NAV-001** MUST: All internal navigational pathways within user interface components and layouts MUST utilize the declarative Link component from next/link to execute client-side route transitions.

### Verify

```bash
# Discover and run static analysis validation script from the project manifest
# Discover and run interface compilation / type verification script from the dependency manifest
# Execute repository search to ensure raw anchor tags are not used for internal application paths
```

**Accept when:**
- Static analysis and interface compilation checks execute without errors or warnings regarding internal navigation component usage or route properties.
- All internal route transitions execute as client-side single-page transitions without initiating full document reloads.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>