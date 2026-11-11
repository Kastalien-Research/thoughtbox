---
version: 2
name: cross-cutting-consumers-discover-repository-dependency-d3e7
description: "Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Consumers Discover Repository Dependency Resolution Lock"
metadata:
  actual:
    adr_id: d3e7affb-7bb7-4d5b-81cc-01ed1c6c9c22
    status: accepted
    candidate_group_id: a7733d88-b94a-4337-8387-0592b66cba74
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Consumers Discover Repository Dependency Resolution Lock

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for route pages, views, and server component render trees responsible for rendering documentation content within the web application.

### Rules

- **R-MDX-001** MUST: Consumers MUST discover the repository dependency resolution lock artifact and verify the exact resolved version of next-mdx-remote/rsc prior to introducing or modifying documentation rendering APIs.

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
Claude Code MUST NOT skip or defer verification. Verification by automated continuous integration pipeline and peer code reviews is mandatory.
</enforcement>