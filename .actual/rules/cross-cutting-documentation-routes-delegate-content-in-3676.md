---
version: 2
name: cross-cutting-documentation-routes-delegate-content-in-3676
description: "Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Routes Delegate Content Ingestion Shared"
metadata:
  actual:
    adr_id: 36763a6a-dc02-4680-bd6d-1c7225f7bf1d
    status: accepted
    candidate_group_id: a7733d88-b94a-4337-8387-0592b66cba74
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Routes Delegate Content Ingestion Shared

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for route pages, views, and server component render trees responsible for rendering documentation content.

### Rules

- **R-DOC-001** MUST: Documentation routes MUST delegate content ingestion to the shared document loading module @/lib/docs/load-doc instead of performing ad-hoc content retrieval within individual route handlers.

### Verify

```bash
# Discover and execute the project static type checker and linter scripts from the repository manifest
# Discover and run the project build script to ensure server component compilation of MDX content completes without errors
# Discover and run the project test suite to validate documentation route rendering and component mapping output
```

**Accept when:**
- All documentation route pages render MDX content without runtime or build-time compilation errors.
- No client-side MDX compiler libraries are included in client bundles for documentation routes.
- Shared component mappings and layout components wrap all documentation content consistently.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>