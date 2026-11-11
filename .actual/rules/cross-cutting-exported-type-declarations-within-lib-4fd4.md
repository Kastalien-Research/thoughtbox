---
version: 2
name: cross-cutting-exported-type-declarations-within-lib-4fd4
description: "Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Exported Type Declarations Within Lib Types"
metadata:
  actual:
    adr_id: 4fd4599d-8ba9-474c-b6e7-e0518a550bd9
    status: accepted
    candidate_group_id: c5457ac3-7f2b-45b7-a133-b910591980d7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Exported Type Declarations Within Lib Types

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all server-side actions, mutations, handlers, client-side components, and data tables operating on or displaying workspace API keys.

### Rules

- **R-API-001** SHOULD: Exported type declarations within the `@/lib/types/api-keys` module MUST maintain strict runtime isolation by excluding client-specific component references or server-specific persistence imports.

### Verify

```bash
# Execute type checking and linting across the project to verify import boundary compliance and shared type usage.
npm run typecheck
npm run lint
```

**Accept when:**
- All consuming server actions and client presentation components compile against the shared type module without type errors.
- No local duplicate type declarations exist for API key entities across client presentation or server action boundaries.
- The shared type module exports exclusively type declarations without pulling runtime dependencies into client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration type checking and boundary linting run on all pull requests, and violations must be refactored to consume the shared type definitions before approval.
</enforcement>