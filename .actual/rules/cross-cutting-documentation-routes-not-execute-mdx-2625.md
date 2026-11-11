---
version: 2
name: cross-cutting-documentation-routes-not-execute-mdx-2625
description: "Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Routes Not Execute Mdx Compilation"
metadata:
  actual:
    adr_id: 26250ad4-a205-4bad-b4d9-709b4499ee14
    status: accepted
    candidate_group_id: a7733d88-b94a-4337-8387-0592b66cba74
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Routes Not Execute Mdx Compilation

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for documentation route pages, views, and server component render trees consuming markdown and MDX documents.

### Rules

- **R-DOC-001** MUST_NOT: Documentation routes MUST NOT execute MDX compilation inside client component boundaries or import client-side markdown compiler runtimes into client bundles.

### Verify

```bash
# Discover and execute project type checker, linter, build, and test scripts from the repository manifest
```

**Accept when:**
- All documentation route pages render MDX content without runtime or build-time compilation errors.
- No client-side MDX compiler libraries are included in client bundles for documentation routes.
- Shared component mappings and layout components wrap all documentation content consistently.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>