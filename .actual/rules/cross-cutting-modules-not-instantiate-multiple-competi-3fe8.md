---
version: 2
name: cross-cutting-modules-not-instantiate-multiple-competi-3fe8
description: "Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Modules Not Instantiate Multiple Competing Client"
metadata:
  actual:
    adr_id: 3fe83130-7e26-4f98-abd1-d2a14ba4ca0c
    status: accepted
    candidate_group_id: 8f4330d9-ce9f-49cc-a36e-2f35fa16fc2a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Modules Not Instantiate Multiple Competing Client

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST_NOT: Modules MUST NOT instantiate multiple competing client libraries for primary relational database access.

### Verify

```bash
# Discover and execute the project type-checking script to validate that all client queries conform to database schema types
npm run typecheck || pnpm typecheck || yarn typecheck

# Discover and execute the project linting and static analysis suite to verify no unauthorized direct database HTTP calls exist
npm run lint || pnpm lint || yarn lint

# Discover and execute the automated test suite to confirm database query modules operate as expected with client abstractions
npm test || pnpm test || yarn test
```

**Accept when:**
- All database and backend service queries authenticate and execute through client instances created using the adopted library API
- No direct raw HTTP requests bypass client boundary abstractions for operations supported by the client SDK
- Static type checking validates that client query operations conform to generated project database type contracts

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>