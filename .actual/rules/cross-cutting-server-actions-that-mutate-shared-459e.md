---
version: 2
name: cross-cutting-server-actions-that-mutate-shared-459e
description: "Next.js Server Actions and Route Handlers for Service Boundaries: Server Actions That Mutate Shared State"
metadata:
  actual:
    adr_id: 459ea633-98cf-452f-8c89-29701157a00c
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

# Next.js Server Actions and Route Handlers for Service Boundaries: Server Actions That Mutate Shared State

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ACT-001** SHOULD: Server actions that mutate shared state SHOULD perform cache invalidation and navigation transitions using framework cache revalidation and navigation primitives rather than client-driven manual polling.

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
Claude Code MUST NOT skip or defer verification. Verification of server action and route handler conventions through automated test passes, lint checks, and static analysis is mandatory.
</enforcement>