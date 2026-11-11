---
version: 2
name: cross-cutting-server-route-handlers-middleware-adopt-e25f
description: "Adoption of next/server Module for Server Route and Middleware Request Handling: Server Route Handlers Middleware Adopt Next"
metadata:
  actual:
    adr_id: e25fb9f2-7658-4da6-bf9f-7a7a8ad8ddd8
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

# Adoption of next/server Module for Server Route and Middleware Request Handling: Server Route Handlers Middleware Adopt Next

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/api/**`.

These rules are ALWAYS ACTIVE for server-side HTTP route handlers, webhooks, authentication callbacks, and middleware interceptors evaluating incoming request headers, query parameters, and session cookies.

### Rules

- **R-SRV-001** MUST: All server route handlers and middleware handlers MUST adopt next/server as the standard module for HTTP request parsing, response generation, and header and cookie lifecycle management.
- **R-SRV-002** MANDATORY: The consumer MUST derive all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-SRV-003** MANDATORY: Before writing code that uses a versioned library, execute in order: find the dependency manifest, identify the build tool, inspect the repository lock or resolution artifact for the exact resolved version, look up official documentation for that exact version, confirm every API/class/function exists in that exact version's documentation, and re-run per dependency at point of use for version-sensitive behavior.
- **R-SRV-004** MUST: Route handlers must consume incoming parameters through the request abstraction and construct standard server responses using the module response primitives.
- **R-SRV-005** MUST: Middleware implementations must manage cookie synchronization across both incoming request headers and outgoing response headers to maintain session continuity.

### Verify

```bash
# Discover the repository build and type-checking scripts from the project manifest and execute type verification
# Locate the automated test suite configuration within the project and execute integration tests targeting server route handlers and middleware endpoints
npm run typecheck
npm test
```

**Accept when:**
- All server route handlers and middleware compile without type errors using the server module interfaces.
- Automated endpoint tests pass, confirming expected query parsing, header inspection, and cookie mutation behaviors.

<enforcement>
Claude Code MUST NOT skip or defer verification. All server route handlers and middleware modifications must be verified by continuous integration type checking, static analysis workflows, and peer code review. Violations or use of non-standard HTTP primitives will block merging.
</enforcement>