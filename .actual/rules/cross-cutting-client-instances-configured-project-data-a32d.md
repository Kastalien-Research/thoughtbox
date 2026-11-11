---
version: 2
name: cross-cutting-client-instances-configured-project-data-a32d
description: "Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Client Instances Configured Project Database Type"
metadata:
  actual:
    adr_id: a32df214-b4de-460a-9d3b-1b1393afb64d
    status: accepted
    candidate_group_id: 8f4330d9-ce9f-49cc-a36e-2f35fa16fc2a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Client Instances Configured Project Database Type

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST: Client instances MUST be configured with project database type contracts to ensure type safety across all queries and data mutations.

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