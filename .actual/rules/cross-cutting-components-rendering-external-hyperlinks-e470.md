---
version: 2
name: cross-cutting-components-rendering-external-hyperlinks-e470
description: "Next.js next/link Navigation Module Adoption: Components Rendering External Hyperlinks Targeting Third"
metadata:
  actual:
    adr_id: e470704c-2e6a-43b2-85da-9a1efa5b28d0
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

# Next.js next/link Navigation Module Adoption: Components Rendering External Hyperlinks Targeting Third

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NAV-001** MAY: Components rendering external hyperlinks targeting third-party origins MAY utilize standard HTML anchor tags with appropriate security attributes or configure the framework Link component with external target properties.

### Verify

```bash
# Discover and execute the static analysis validation script from the project manifest
# Discover and execute the interface compilation and type verification script
# Use repository search utility to inspect presentation files for raw anchor tags targeting internal application paths
```

**Accept when:**
- Static analysis and interface compilation checks execute without errors or warnings regarding internal navigation component usage or route properties.
- All internal route transitions execute as client-side single-page transitions without initiating full document reloads.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration builds fail when unmanaged anchor tags are detected targeting internal application routes.
</enforcement>