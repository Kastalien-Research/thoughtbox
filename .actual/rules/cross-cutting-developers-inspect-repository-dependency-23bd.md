---
version: 2
name: cross-cutting-developers-inspect-repository-dependency-23bd
description: "Next.js next/link Navigation Module Adoption: Developers Inspect Repository Dependency Resolution Artifact"
metadata:
  actual:
    adr_id: 23bd2e81-d36c-4448-8568-baee9a207043
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

# Next.js next/link Navigation Module Adoption: Developers Inspect Repository Dependency Resolution Artifact

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NAV-001** MUST: Developers MUST inspect the repository dependency resolution artifact to verify the authoritative locked version of the framework navigation module prior to invoking its export APIs.
- **R-NAV-002** MUST: All user interface components, layouts, templates, and view panels rendering internal navigation links within the web application MUST use the framework navigation module rather than standard unmanaged HTML anchor tags.

### Verify

```bash
# Discover and execute the static analysis validation script from the project manifest
# Discover and execute the interface compilation and type verification script
# Discover the repository search utility and inspect presentation files to ensure raw anchor tags are not used for internal application paths
```

**Accept when:**
- Static analysis and interface compilation checks execute without errors or warnings regarding internal navigation component usage or route properties.
- All internal route transitions execute as client-side single-page transitions without initiating full document reloads.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration builds fail when unmanaged anchor tags are detected targeting internal application routes.
</enforcement>