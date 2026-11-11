---
version: 2
name: cross-cutting-server-route-handlers-access-incoming-ac81
description: "Adoption of next/server Module for Server Route and Middleware Request Handling: Server Route Handlers Access Incoming Request"
metadata:
  actual:
    adr_id: ac81b797-501e-452b-8772-7d1303463393
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

# Adoption of next/server Module for Server Route and Middleware Request Handling: Server Route Handlers Access Incoming Request

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/api/**`.

These rules are ALWAYS ACTIVE for server-side HTTP route handlers, webhooks, authentication callbacks, and middleware interceptors evaluating incoming request headers, query parameters, and session cookies.

### Rules

- **R-SRV-001** MUST: Server route handlers MUST access incoming request URL query parameters via the nextUrl searchParams interface or URL search parameter parsers provided by the next/server request abstraction.

### Verify

```bash
# Discover and execute project type-checking script
# Discover and execute project automated test suite targeting server route handlers and middleware
```

**Accept when:**
- All server route handlers and middleware compile without type errors using the server module interfaces.
- Automated endpoint tests pass, confirming expected query parsing, header inspection, and cookie mutation behaviors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration type checking, static analysis, and peer code review workflows verify server imports and signatures. Pull requests utilizing non-standard HTTP primitives or failing server interface type checks will be blocked from merging.
</enforcement>