---
version: 2
name: cross-cutting-components-not-bypass-framework-navigati-3adf
description: "Adoption of Next.js Navigation Module for Application Route Handling: Components Not Bypass Framework Navigation Abstractions"
metadata:
  actual:
    adr_id: 3adfcef7-36d6-40a9-868f-21e4013528b1
    status: accepted
    candidate_group_id: 773a65a9-728b-45f5-9e58-712632fa746d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of Next.js Navigation Module for Application Route Handling: Components Not Bypass Framework Navigation Abstractions

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for application route entrypoints, interactive components requiring programmatic navigation or route parameter access, and shared presentation and explorer components deployed across authenticated and public route trees.

### Rules

- **R-NAV-001** MUST_NOT: Components MUST NOT bypass framework navigation abstractions by directly manipulating browser window location or history objects for internal application routing.

### Verify

```bash
# Discover the project build configuration and run type verification
# Discover and run repository linter to verify routing import boundaries
```

**Accept when:**
- Static type verification passes without errors across all route entrypoints importing navigation primitives.
- Linter rules confirm that internal routing references use framework navigation rather than direct window location modifications.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration checks executing repository type verification and linting, and peer code review.
</enforcement>