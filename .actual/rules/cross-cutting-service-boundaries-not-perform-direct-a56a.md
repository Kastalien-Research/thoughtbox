---
version: 2
name: cross-cutting-service-boundaries-not-perform-direct-a56a
description: "Next.js Server Actions and Route Handlers for Service Boundaries: Service Boundaries Not Perform Direct Data"
metadata:
  actual:
    adr_id: a56a81da-9d06-4931-86af-1d110a72994a
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

# Next.js Server Actions and Route Handlers for Service Boundaries: Service Boundaries Not Perform Direct Data

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all client-to-server mutation operations, external webhook ingestion endpoints, and server-side data access procedures matching the configured scope.

### Rules

- **R-SB-001** MUST_NOT: Service boundaries MUST NOT perform direct data mutations within client-rendered components without delegating through an authorized server action or route handler.

### Verify

```bash
# Discover workspace script runner and execute typecheck across service boundary modules
# Discover repository test runner and execute boundary and integration test suites
# Discover and execute repository static analysis and linting suite
```

**Accept when:**
- All service boundary modules pass static type checking without interface mismatches or missing parameter validations.
- All automated integration and unit test suites for server actions and route handlers pass with zero test failures.
- Static analysis validates that all boundary mutations route through authorized server execution boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests introducing or modifying service boundaries must comply with server action and route handler conventions.
</enforcement>