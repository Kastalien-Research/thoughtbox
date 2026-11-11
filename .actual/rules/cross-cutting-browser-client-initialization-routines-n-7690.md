---
version: 2
name: cross-cutting-browser-client-initialization-routines-n-7690
description: "Adoption of @supabase/ssr for Server and Client Runtime Isolation: Browser Client Initialization Routines Not Import"
metadata:
  actual:
    adr_id: 76907108-eafc-4776-9c6a-6ff65736a913
    status: accepted
    candidate_group_id: 4d420b84-149f-4fd3-8aa4-5241d34ed725
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Server and Client Runtime Isolation: Browser Client Initialization Routines Not Import

Scope: applies to `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all data access and authentication modules targeting the managed database service from browser or server execution contexts, and request lifecycle handlers requiring authenticated session access via cookie storage.

### Rules

- **R-SUPA-001** MUST_NOT: Browser client initialization routines MUST NOT import or invoke server header or cookie store functions.

### Verify

```bash
# Discover and execute the project type checker to verify that database type bindings conform to all query interfaces.
# Discover and execute the project linter to ensure server-specific headers and cookies are not imported into client modules.
# Discover the project verification script from the root manifest and execute the test runner to validate client instantiation across environments.
```

**Accept when:**
- Client instantiation tests execute without errors across both server and browser test environments.
- Type checking passes with zero compiler errors across all modules importing the client factories.
- Lint checks confirm no boundary crossing between server header modules and client-side entry points.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via continuous integration type checking, static analysis workflows, and peer code review.
</enforcement>