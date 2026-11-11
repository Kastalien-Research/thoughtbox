---
version: 2
name: cross-cutting-server-side-mutation-actions-client-d9c2
description: "Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Server Side Mutation Actions Client User"
metadata:
  actual:
    adr_id: d9c2b7c4-9014-4015-8484-4b4784c47b96
    status: accepted
    candidate_group_id: c5457ac3-7f2b-45b7-a133-b910591980d7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Server Side Mutation Actions Client User

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-API-001** MUST: All server-side mutation actions and client-side user interface components managing API key resources MUST import their entity models and contract definitions from the internal `@/lib/types/api-keys` module.

### Verify

```bash
# Discover and execute project type checking and linting scripts
npm run typecheck
npm run lint
```

**Accept when:**
- All consuming server actions and client presentation components compile against the shared type module without type errors.
- No local duplicate type declarations exist for API key entities across client presentation or server action boundaries.
- The shared type module exports exclusively type declarations without pulling runtime dependencies into client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Pull requests containing duplicate API key interfaces or cross-boundary contract mismatches are blocked from merging.
</enforcement>