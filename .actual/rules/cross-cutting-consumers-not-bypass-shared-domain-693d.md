---
version: 2
name: cross-cutting-consumers-not-bypass-shared-domain-693d
description: "Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Consumers Not Bypass Shared Domain Interfaces"
metadata:
  actual:
    adr_id: 693df1e1-12ca-49fc-a065-1771f4b7bbd5
    status: accepted
    candidate_group_id: c5457ac3-7f2b-45b7-a133-b910591980d7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Consumers Not Bypass Shared Domain Interfaces

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-API-001** SHOULD_NOT: Consumers SHOULD NOT bypass shared domain interfaces when passing form data or server action payloads between boundary tiers.

### Verify

```bash
# Discover the project verification script from the repository manifest and execute type checking across all workspace packages.
# Run the project's static analysis and linting scripts to verify import boundary compliance for shared type modules.
npm run typecheck
npm run lint
```

**Accept when:**
- All consuming server actions and client presentation components compile against the shared type module without type errors.
- No local duplicate type declarations exist for API key entities across client presentation or server action boundaries.
- The shared type module exports exclusively type declarations without pulling runtime dependencies into client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration type checking and boundary linting runs on all pull requests.
</enforcement>