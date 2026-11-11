---
version: 2
name: cross-cutting-engineers-discover-repository-lock-artif-9ad9
description: "Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Engineers Discover Repository Lock Artifact Verify"
metadata:
  actual:
    adr_id: 9ad989d5-839c-400f-b5bf-c61b4eb7a6ff
    status: accepted
    candidate_group_id: c5457ac3-7f2b-45b7-a133-b910591980d7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Engineers Discover Repository Lock Artifact Verify

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all server-side actions, mutations, handlers, client-side components, and data tables operating on workspace API keys.

### Rules

- **R-APIKEY-001** MUST: Engineers MUST discover the repository lock artifact and verify the exact resolved versions of the shared type checker and core dependencies before extending or consuming shared module interfaces.
- **R-APIKEY-002** MUST: Ensure that all exported structures in the shared type module contain only pure type declarations and no runtime executable side effects.
- **R-APIKEY-003** MUST: Update the shared type module first when adding new attributes to API key records and ensure both mutation handlers and display tables satisfy the updated contract.

### Verify

```bash
# Discover the project verification script from the repository manifest and execute type checking across all workspace packages.
# Run the project's static analysis and linting scripts to verify import boundary compliance for shared type modules.
```

**Accept when:**
- All consuming server actions and client presentation components compile against the shared type module without type errors.
- No local duplicate type declarations exist for API key entities across client presentation or server action boundaries.
- The shared type module exports exclusively type declarations without pulling runtime dependencies into client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration type checking and boundary linting run on all pull requests.
</enforcement>