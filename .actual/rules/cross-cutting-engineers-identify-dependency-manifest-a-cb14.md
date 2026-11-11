---
version: 2
name: cross-cutting-engineers-identify-dependency-manifest-a-cb14
description: "Adoption of Next.js Navigation Module for Application Route Handling: Engineers Identify Dependency Manifest Authoritative Resolution"
metadata:
  actual:
    adr_id: cb142fff-d233-43e8-94c0-b7275eab47db
    status: accepted
    candidate_group_id: 773a65a9-728b-45f5-9e58-712632fa746d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of Next.js Navigation Module for Application Route Handling: Engineers Identify Dependency Manifest Authoritative Resolution

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NAV-001** MUST: Engineers MUST identify the dependency manifest and authoritative resolution lock artifact to verify the exact resolved version of the framework navigation library before invoking framework navigation primitives.

### Verify

```bash
# Discover the project build configuration and run type verification
# Discover and run repository linter to verify routing import boundaries
```

**Accept when:**
- Static type verification passes without errors across all route entrypoints importing navigation primitives.
- Linter rules confirm that internal routing references use framework navigation rather than direct window location modifications.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>