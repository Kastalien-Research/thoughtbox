---
version: 2
name: cross-cutting-before-implementing-updating-endpoints-u-32e2
description: "Adoption of next/server Module for Server Route and Middleware Request Handling: Before Implementing Updating Endpoints Utilizing Next"
metadata:
  actual:
    adr_id: 32e2569e-e020-4c58-bf3c-700f719aa0ee
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

# Adoption of next/server Module for Server Route and Middleware Request Handling: Before Implementing Updating Endpoints Utilizing Next

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/api/**`.

These rules are ALWAYS ACTIVE for server-side HTTP route handlers, webhooks, authentication callbacks, and middleware interceptors evaluating incoming request headers, query parameters, and session cookies.

### Rules

- **R-NS-001** MUST: Before implementing or updating endpoints utilizing next/server, the consumer MUST discover the ecosystem lock artifact in the repository and verify the exact resolved version against public documentation for that version.

### Verify

```bash
# Discover the repository build and type-checking scripts from the project manifest and execute type verification
# Locate the automated test suite configuration within the project and execute integration tests targeting server route handlers and middleware endpoints
```

**Accept when:**
- All server route handlers and middleware compile without type errors using the server module interfaces.
- Automated endpoint tests pass, confirming expected query parsing, header inspection, and cookie mutation behaviors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by continuous integration type checking, static analysis workflows, and peer code review.
</enforcement>