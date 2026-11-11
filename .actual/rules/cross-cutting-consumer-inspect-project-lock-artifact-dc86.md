---
version: 2
name: cross-cutting-consumer-inspect-project-lock-artifact-dc86
description: "Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Consumer Inspect Project Lock Artifact Resolve"
metadata:
  actual:
    adr_id: dc8692d8-1321-45b2-89c3-1a429e820864
    status: accepted
    candidate_group_id: 8f4330d9-ce9f-49cc-a36e-2f35fa16fc2a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Consumer Inspect Project Lock Artifact Resolve

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-DB-001** MUST: The consumer MUST inspect the project lock artifact to resolve the exact installed version of the adopted client library before utilizing client APIs.

### Verify

```bash
# Discover and execute project type-checking, linting, and test suites
# (Project-specific commands to be derived from the repository manifest and configuration)
```

**Accept when:**
- All database and backend service queries authenticate and execute through client instances created using the adopted library API
- No direct raw HTTP requests bypass client boundary abstractions for operations supported by the client SDK
- Static type checking validates that client query operations conform to generated project database type contracts

<enforcement>
Claude Code MUST NOT skip or defer verification. All database and backend data operations must adhere to the standardized client library abstraction and verified project lock artifacts.
</enforcement>