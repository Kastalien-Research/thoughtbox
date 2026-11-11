---
version: 2
name: cross-cutting-server-route-handlers-middleware-not-a3bf
description: "Adoption of next/server Module for Server Route and Middleware Request Handling: Server Route Handlers Middleware Not Bypass"
metadata:
  actual:
    adr_id: a3bf2211-2f1c-4d61-977c-e45aee8a68ed
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

# Adoption of next/server Module for Server Route and Middleware Request Handling: Server Route Handlers Middleware Not Bypass

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/api/**`.

These rules are ALWAYS ACTIVE for server-side HTTP route handlers, webhooks, authentication callbacks, and middleware interceptors.

### Rules

- **R-NS-001** MUST_NOT: Server route handlers and middleware MUST NOT bypass next/server primitives to access untyped platform-specific global HTTP request or response sockets.

### Verify

```bash
# Discover the repository build and type-checking scripts from the project manifest and execute type verification
# Locate the automated test suite configuration within the project and execute integration tests targeting server route handlers and middleware endpoints
```

**Accept when:**
- All server route handlers and middleware compile without type errors using the server module interfaces.
- Automated endpoint tests pass, confirming expected query parsing, header inspection, and cookie mutation behaviors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration type checking, static analysis workflows, and peer code reviews verify server imports and signatures. Pull requests utilizing non-standard HTTP primitives or failing server interface type checks will be blocked from merging.
</enforcement>