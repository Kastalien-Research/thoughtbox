---
version: 2
name: cross-cutting-webhook-handlers-authenticated-server-en-a28a
description: "Adoption of next/server Module for Server Route and Middleware Request Handling: Webhook Handlers Authenticated Server Endpoints Requiring"
metadata:
  actual:
    adr_id: a28a527d-1692-4bed-8751-4907b8cd2304
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

# Adoption of next/server Module for Server Route and Middleware Request Handling: Webhook Handlers Authenticated Server Endpoints Requiring

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/api/**`.

These rules are ALWAYS ACTIVE for all server-side HTTP route handlers, authentication callbacks, external integration webhooks, and request middleware.

### Rules

- **R-NXT-001** MUST: Webhook handlers and authenticated server endpoints requiring signature verification or custom metadata extraction MUST read transport headers directly through the headers interface of the next/server request object.

### Verify

```bash
# Discover and execute project type checking and integration test scripts from the manifest
npm run build || pnpm run build || yarn build
npm test || pnpm test || yarn test
```

**Accept when:**
- All server route handlers and middleware compile without type errors using the server module interfaces.
- Automated endpoint tests pass, confirming expected query parsing, header inspection, and cookie mutation behaviors.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration type checking and static analysis workflows verify server imports and signatures, and PRs utilizing non-standard HTTP primitives or failing server interface type checks will be blocked from merging.
</enforcement>