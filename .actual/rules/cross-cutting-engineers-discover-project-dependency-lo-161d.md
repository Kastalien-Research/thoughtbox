---
version: 2
name: cross-cutting-engineers-discover-project-dependency-lo-161d
description: "Adoption of @supabase/ssr for Server and Client Runtime Isolation: Engineers Discover Project Dependency Lock Artifact"
metadata:
  actual:
    adr_id: 161d9912-deff-4a2d-b6a9-8c8230b57364
    status: accepted
    candidate_group_id: 4d420b84-149f-4fd3-8aa4-5241d34ed725
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Server and Client Runtime Isolation: Engineers Discover Project Dependency Lock Artifact

Scope: applies to `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST: Engineers MUST discover the project dependency lock artifact and resolve the exact installed version of @supabase/ssr before calling its initialization APIs.

### Verify

```bash
# Discover the project verification script from the root manifest and execute the test runner to validate client instantiation across environments.
# Discover and run the project type checker to verify that database type bindings conform to all query interfaces.
# Discover and execute the project linter to ensure server-specific headers and cookies are not imported into client modules.
```

**Accept when:**
- Client instantiation tests execute without errors across both server and browser test environments.
- Type checking passes with zero compiler errors across all modules importing the client factories.
- Lint checks confirm no boundary crossing between server header modules and client-side entry points.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>