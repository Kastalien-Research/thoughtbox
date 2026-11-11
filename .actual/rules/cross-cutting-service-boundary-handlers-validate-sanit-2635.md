---
version: 2
name: cross-cutting-service-boundary-handlers-validate-sanit-2635
description: "Next.js Server Actions and Route Handlers for Service Boundaries: Service Boundary Handlers Validate Sanitize Extracted"
metadata:
  actual:
    adr_id: 2635b968-ea71-4cea-ad78-a3b67457affc
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

# Next.js Server Actions and Route Handlers for Service Boundaries: Service Boundary Handlers Validate Sanitize Extracted

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SB-001** SHOULD: Service boundary handlers SHOULD validate and sanitize all extracted input parameters prior to passing arguments to internal backend clients and data layers.

### Verify

```bash
# Discover workspace script runner and execute typecheck
# Discover repository test runner and execute boundary/integration test suites
# Discover and execute repository static analysis and linting suite
```

**Accept when:**
- All service boundary modules pass static type checking without interface mismatches or missing parameter validations.
- All automated integration and unit test suites for server actions and route handlers pass with zero test failures.
- Static analysis validates that all boundary mutations route through authorized server execution boundaries.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>