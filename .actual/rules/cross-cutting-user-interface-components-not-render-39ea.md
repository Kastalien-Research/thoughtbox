---
version: 2
name: cross-cutting-user-interface-components-not-render-39ea
description: "Next.js next/link Navigation Module Adoption: User Interface Components Not Render Standard"
metadata:
  actual:
    adr_id: 39ea2777-4501-4a16-a957-7338db4ad98b
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

# Next.js next/link Navigation Module Adoption: User Interface Components Not Render Standard

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`.

These rules are ALWAYS ACTIVE for all user interface components, layouts, templates, and view panels rendering internal navigation links within the web application.

### Rules

- **R-NAV-001** MUST_NOT: User interface components MUST NOT render standard unmanaged anchor elements for routing between internal application paths.

### Verify

```bash
# Discover and execute the static analysis validation script from the project manifest
# Discover and execute the interface compilation and type verification script from the dependency manifest
# Run repository search utility to inspect presentation files for raw anchor tags targeting internal application paths
```

**Accept when:**
- Static analysis and interface compilation checks execute without errors or warnings regarding internal navigation component usage or route properties.
- All internal route transitions execute as client-side single-page transitions without initiating full document reloads.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>