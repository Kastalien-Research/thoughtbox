---
version: 2
name: cross-cutting-server-actions-handling-user-mutations-855e
description: "Next.js Server Actions and Route Handlers for Service Boundaries: Server Actions Handling User Mutations Accept"
metadata:
  actual:
    adr_id: 855ee3e6-cb1c-45b9-91f8-3ede418c3855
    status: accepted
    candidate_group_id: 914d6519-b1e2-4337-b21a-77156e9bedd7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/components/session-area/**
      - src/lib/**
---

# Next.js Server Actions and Route Handlers for Service Boundaries: Server Actions Handling User Mutations Accept

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all client-to-server mutation operations triggered from user interface components, external webhook ingestion endpoints, and server-side data access procedures.

### Rules

- **R-ACT-001** MUST: Server actions handling user mutations MUST accept standard form data payloads and extract parameters using FormData retrieval methods rather than exposing raw database models or untyped request bodies.

### Verify

```bash
# Discover the workspace script runner and execute the typecheck script across all service boundary modules
# Discover the repository test runner and execute the boundary and integration test suites
# Discover and execute the repository static analysis and linting suite to verify compliance with server boundary conventions
```

**Accept when:**
- All service boundary modules pass static type checking without interface mismatches or missing parameter validations.
- All automated integration and unit test suites for server actions and route handlers pass with zero test failures.
- Static analysis validates that all boundary mutations route through authorized server execution boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>