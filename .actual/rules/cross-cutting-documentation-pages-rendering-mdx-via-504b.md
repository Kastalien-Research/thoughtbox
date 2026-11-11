---
version: 2
name: cross-cutting-documentation-pages-rendering-mdx-via-504b
description: "Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Pages Rendering Mdx Via Next"
metadata:
  actual:
    adr_id: 504b42ba-fcdd-4e53-be06-6e67192ac9fb
    status: accepted
    candidate_group_id: a7733d88-b94a-4337-8387-0592b66cba74
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Pages Rendering Mdx Via Next

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-MDX-001** MUST: Documentation pages rendering MDX via next-mdx-remote/rsc MUST supply custom element definitions through the shared component mapping module @/components/docs/mdx-components.

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