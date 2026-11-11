---
version: 2
name: cross-cutting-service-boundary-handlers-extract-incomi-cb05
description: "Next.js Server Actions and Route Handlers for Service Boundaries: Service Boundary Handlers Extract Incoming Request"
metadata:
  actual:
    adr_id: cb05c1cb-9f93-47d8-b898-b68ebce93f96
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

# Next.js Server Actions and Route Handlers for Service Boundaries: Service Boundary Handlers Extract Incoming Request

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SB-001** MAY: Service boundary handlers MAY extract incoming request headers and origin metadata when required for multi-tenant tenancy resolution or third-party cryptographic signature verification.

### Verify

```bash
# Discover the workspace script runner and execute the project typecheck script across all service boundary modules.
# Discover the repository test runner and execute the boundary and integration test suites.
# Discover and execute the repository static analysis and linting suite to verify compliance with server boundary conventions.
```

**Accept when:**
- All service boundary modules pass static type checking without interface mismatches or missing parameter validations.
- All automated integration and unit test suites for server actions and route handlers pass with zero test failures.
- Static analysis validates that all boundary mutations route through authorized server execution boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>