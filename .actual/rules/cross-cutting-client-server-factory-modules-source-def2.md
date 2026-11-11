---
version: 2
name: cross-cutting-client-server-factory-modules-source-def2
description: "Adoption of @supabase/ssr for Server and Client Runtime Isolation: Client Server Factory Modules Source Connection"
metadata:
  actual:
    adr_id: def23146-0735-4cca-97cd-5cc472cf2102
    status: accepted
    candidate_group_id: 4d420b84-149f-4fd3-8aa4-5241d34ed725
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Server and Client Runtime Isolation: Client Server Factory Modules Source Connection

Scope: applies to `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all data access and authentication modules targeting the managed database service from browser or server execution contexts, and request lifecycle handlers requiring authenticated session access via cookie storage.

### Rules

- **R-SUP-001** MUST: Client and server factory modules MUST source connection parameters strictly from declared runtime configuration environments using designated public endpoint and key variables.

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
Claude Code MUST NOT skip or defer verification. Continuous integration type checking, static analysis workflows, and peer code review enforce runtime boundary constraints.
</enforcement>