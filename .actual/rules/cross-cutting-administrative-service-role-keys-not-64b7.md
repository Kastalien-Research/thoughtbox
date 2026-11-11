---
version: 2
name: cross-cutting-administrative-service-role-keys-not-64b7
description: "Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Administrative Service Role Keys Not Utilized"
metadata:
  actual:
    adr_id: 64b7c7c9-35f6-41f2-9027-58a0913cb2a3
    status: accepted
    candidate_group_id: 8f4330d9-ce9f-49cc-a36e-2f35fa16fc2a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Administrative Service Role Keys Not Utilized

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST: Administrative service role keys MUST NOT be utilized outside of authenticated server execution environments.

### Verify

```bash
# Discover and execute the project type-checking script
# Discover and execute the project linting and static analysis suite
# Discover and execute the automated test suite
```

**Accept when:**
- All database and backend service queries authenticate and execute through client instances created using the adopted library API
- No direct raw HTTP requests bypass client boundary abstractions for operations supported by the client SDK
- Static type checking validates that client query operations conform to generated project database type contracts

<enforcement>
Claude Code MUST NOT skip or defer verification. All database operations and client usage must conform to defined architectural boundaries and type contracts.
</enforcement>