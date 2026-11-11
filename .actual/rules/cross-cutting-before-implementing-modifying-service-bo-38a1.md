---
version: 2
name: cross-cutting-before-implementing-modifying-service-bo-38a1
description: "Next.js Server Actions and Route Handlers for Service Boundaries: Before Implementing Modifying Service Boundary Endpoints"
metadata:
  actual:
    adr_id: 38a16dc5-224b-4f22-b7f9-0d87a87b977c
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

# Next.js Server Actions and Route Handlers for Service Boundaries: Before Implementing Modifying Service Boundary Endpoints

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all client-to-server mutation operations, external webhook ingestion endpoints, and server-side data access procedures requiring authenticated service client instantiation.

### Rules

- **R-NXT-001** MUST: Before implementing or modifying service boundary endpoints relying on the framework, developers MUST inspect the repository dependency lock artifact to verify the exact installed framework version and validate API compatibility against version-specific documentation.

### Verify

```bash
# Discover and execute the project typecheck script across all service boundary modules
# Discover and execute the repository test runner for boundary and integration test suites
# Discover and execute the repository static analysis and linting suite
```

**Accept when:**
- All service boundary modules pass static type checking without interface mismatches or missing parameter validations.
- All automated integration and unit test suites for server actions and route handlers pass with zero test failures.
- Static analysis validates that all boundary mutations route through authorized server execution boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>