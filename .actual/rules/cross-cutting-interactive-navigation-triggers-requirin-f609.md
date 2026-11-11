---
version: 2
name: cross-cutting-interactive-navigation-triggers-requirin-f609
description: "Next.js next/link Navigation Module Adoption: Interactive Navigation Triggers Requiring Programmatic State"
metadata:
  actual:
    adr_id: f6094d73-4b5f-4a11-92d8-8a247fc997fc
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

# Next.js next/link Navigation Module Adoption: Interactive Navigation Triggers Requiring Programmatic State

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`.

These rules are ALWAYS ACTIVE for all user interface components, layouts, templates, and view panels rendering internal navigation links within the web application.

### Rules

- **R-NAV-001** SHOULD: Interactive navigation triggers requiring programmatic state evaluation prior to routing utilize framework navigation hooks from next/navigation only when declarative Link composition is insufficient.

### Verify

```bash
# Discover and execute static analysis validation script
# Discover and execute interface compilation and type verification script
# Execute repository search to ensure raw anchor tags are not used for internal application paths
```

**Accept when:**
- Static analysis and interface compilation checks execute without errors or warnings regarding internal navigation component usage or route properties.
- All internal route transitions execute as client-side single-page transitions without initiating full document reloads.

<enforcement>
Claude Code MUST NOT skip or defer verification. All internal navigation references must utilize the framework routing component, and violation handling will cause continuous integration builds to fail.
</enforcement>