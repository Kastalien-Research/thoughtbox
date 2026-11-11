---
version: 2
name: cross-cutting-database-operations-backend-administrati-a56a
description: "Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Database Operations Backend Administrative Service Interactions"
metadata:
  actual:
    adr_id: a56aebe7-b0bd-4e32-a6c0-6d2225df6dfc
    status: accepted
    candidate_group_id: 8f4330d9-ce9f-49cc-a36e-2f35fa16fc2a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Database Operations Backend Administrative Service Interactions

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all server-side route handlers executing database queries, domain knowledge query modules, graph persistence libraries, and authentication lifecycle/claim handling flows interacting with backend user management.

### Rules

- **R-SUP-001** MUST: All database operations and backend administrative service interactions MUST use @supabase/supabase-js client instances rather than direct unabstracted network requests.

### Verify

```bash
# Discover and execute the project type-checking script to validate that all client queries conform to database schema types
# Discover and execute the project linting and static analysis suite to verify no unauthorized direct database HTTP calls exist
# Discover and execute the automated test suite to confirm database query modules operate as expected with client abstractions
```

**Accept when:**
- All database and backend service queries authenticate and execute through client instances created using the adopted library API
- No direct raw HTTP requests bypass client boundary abstractions for operations supported by the client SDK
- Static type checking validates that client query operations conform to generated project database type contracts

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>