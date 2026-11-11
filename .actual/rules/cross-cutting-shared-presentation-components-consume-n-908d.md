---
version: 2
name: cross-cutting-shared-presentation-components-consume-n-908d
description: "Adoption of Next.js Navigation Module for Application Route Handling: Shared Presentation Components Consume Navigation Hooks"
metadata:
  actual:
    adr_id: 908d320c-5fc5-4723-bc6a-c5c3d4639da9
    status: accepted
    candidate_group_id: 773a65a9-728b-45f5-9e58-712632fa746d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of Next.js Navigation Module for Application Route Handling: Shared Presentation Components Consume Navigation Hooks

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for application route entrypoints, interactive components, and shared presentation/explorer components deployed across authenticated and public route trees.

### Rules

- **R-NAV-001** MAY: Shared presentation components MAY consume navigation hooks directly when self-contained navigation behaviors are required across multiple route contexts.

### Verify

```bash
# Discover the project build configuration and run type verification
# Discover and run repository linter to verify routing import boundaries
```

**Accept when:**
- Static type verification passes without errors across all route entrypoints importing navigation primitives.
- Linter rules confirm that internal routing references use framework navigation rather than direct window location modifications.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>