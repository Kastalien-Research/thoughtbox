---
version: 2
name: cross-cutting-documentation-route-pages-use-next-a373
description: "Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Route Pages Use Next Mdx"
metadata:
  actual:
    adr_id: a3734e0d-59a3-4872-bbeb-a332313435dc
    status: accepted
    candidate_group_id: a7733d88-b94a-4337-8387-0592b66cba74
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Route Pages Use Next Mdx

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-DOC-001** MUST: Documentation route pages MUST use next-mdx-remote/rsc for server-side MDX parsing and rendering within server components.

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