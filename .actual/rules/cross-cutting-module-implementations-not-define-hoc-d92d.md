---
version: 2
name: cross-cutting-module-implementations-not-define-hoc-d92d
description: "Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Module Implementations Not Define Hoc Duplicate"
metadata:
  actual:
    adr_id: d92da9d6-2b6b-4cd8-8473-827fc1f83743
    status: accepted
    candidate_group_id: c5457ac3-7f2b-45b7-a133-b910591980d7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Module Implementations Not Define Hoc Duplicate

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-APIK-001** MUST_NOT: Module implementations MUST NOT define ad-hoc or duplicate local type definitions for API key entities across server and client boundaries.

### Verify

```bash
# Discover and run the project type checking script across workspace packages
# Discover and run the project's static analysis and linting scripts
```

**Accept when:**
- All consuming server actions and client presentation components compile against the shared type module without type errors.
- No local duplicate type declarations exist for API key entities across client presentation or server action boundaries.
- The shared type module exports exclusively type declarations without pulling runtime dependencies into client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>