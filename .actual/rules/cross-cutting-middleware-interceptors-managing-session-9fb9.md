---
version: 2
name: cross-cutting-middleware-interceptors-managing-session-9fb9
description: "Adoption of next/server Module for Server Route and Middleware Request Handling: Middleware Interceptors Managing Session State Response"
metadata:
  actual:
    adr_id: 9fb90c57-9e0d-4115-861a-77bc47a249b9
    status: accepted
    candidate_group_id: 48ac5d5d-c71f-4fa8-a4cc-f3b9a043eb56
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - middleware.ts
      - src/app/api/**
---

# Adoption of next/server Module for Server Route and Middleware Request Handling: Middleware Interceptors Managing Session State Response

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/api/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NSM-001** MUST: Middleware interceptors managing session state or response modifications MUST manipulate client cookies using the cookies abstraction exposed on the next/server request and response objects.

### Verify

```bash
# Discover build/type-checking scripts from project manifest and execute type verification
# Locate automated test suite configuration and execute integration tests targeting server route handlers and middleware
```

**Accept when:**
- All server route handlers and middleware compile without type errors using the server module interfaces.
- Automated endpoint tests pass, confirming expected query parsing, header inspection, and cookie mutation behaviors.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>