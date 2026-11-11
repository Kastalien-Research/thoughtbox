---
version: 2
name: cross-cutting-data-queries-encapsulated-dedicated-libr-8965
description: "Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Data Queries Encapsulated Dedicated Library Modules"
metadata:
  actual:
    adr_id: 89655b6c-57d9-4f36-aab6-1a9ba57f3e26
    status: accepted
    candidate_group_id: 8f4330d9-ce9f-49cc-a36e-2f35fa16fc2a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Data Queries Encapsulated Dedicated Library Modules

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** SHOULD: Data queries SHOULD be encapsulated in dedicated library modules rather than executed directly within user interface components.

### Verify

```bash
# Discover and execute the project type-checking script to validate that all client queries conform to database schema types
npm run typecheck

# Discover and execute the project linting and static analysis suite to verify no unauthorized direct database HTTP calls exist
npm run lint

# Discover and execute the automated test suite to confirm database query modules operate as expected with client abstractions
npm test
```

**Accept when:**
- All database and backend service queries authenticate and execute through client instances created using the adopted library API
- No direct raw HTTP requests bypass client boundary abstractions for operations supported by the client SDK
- Static type checking validates that client query operations conform to generated project database type contracts

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>