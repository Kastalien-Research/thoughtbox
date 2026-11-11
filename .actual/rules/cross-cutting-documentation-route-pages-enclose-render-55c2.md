---
version: 2
name: cross-cutting-documentation-route-pages-enclose-render-55c2
description: "Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Route Pages Enclose Rendered Content"
metadata:
  actual:
    adr_id: 55c2ec2b-2252-461f-9975-72c4c8dde79e
    status: accepted
    candidate_group_id: a7733d88-b94a-4337-8387-0592b66cba74
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Route Pages Enclose Rendered Content

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for route pages and views responsible for rendering documentation content within the web application, and server component render trees consuming markdown and MDX documents.

### Rules

- **R-DOC-001** SHOULD: Documentation route pages SHOULD enclose rendered content within the shared documentation layout component @/components/docs/doc-layout to preserve visual and navigation parity.
- **R-DOC-002** MANDATORY: Invoke next-mdx-remote/rsc within server component route handlers, passing raw document source obtained from the centralized document loader.
- **R-DOC-003** MANDATORY: Register custom components, code block highlighters, and container elements within the shared component mapping module to ensure design system compliance.
- **R-DOC-004** MANDATORY (DISCOVERY POLICY): Omit all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.
- **R-DOC-005** MANDATORY (LOCK-VERSION GROUNDING): Before writing code that uses a versioned library, execute in order: (1) Find dependency manifest in the repo; (2) Identify build tool; (3) Inspect repository lock/resolution artifact for exact version; (4) Look up official docs/changelog for that exact version; (5) Confirm every API/class/function exists in that version; (6) Re-run steps 3-5 per dependency at point of use for version-sensitive behavior.

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
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration pipeline and peer code reviews.
</enforcement>