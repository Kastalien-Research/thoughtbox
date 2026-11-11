---
version: 2
name: cross-cutting-applications-interacting-persistence-aut-016b
description: "Adoption of @supabase/ssr for Server and Client Runtime Isolation: Applications Interacting Persistence Authentication Layer Use"
metadata:
  actual:
    adr_id: 016babde-cc34-4ea8-98f3-51ae5865861f
    status: accepted
    candidate_group_id: 4d420b84-149f-4fd3-8aa4-5241d34ed725
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Server and Client Runtime Isolation: Applications Interacting Persistence Authentication Layer Use

Scope: applies to `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST: Applications interacting with the persistence and authentication layer MUST use @supabase/ssr to construct isolated server and browser client instances.

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
Claude Code MUST NOT skip or defer verification. Continuous integration type checking, static analysis workflows, and peer code reviews verify compliance. Pull requests violating runtime boundary constraints or introducing untyped client initializations are blocked from merging.
</enforcement>