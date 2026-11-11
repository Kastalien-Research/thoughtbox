---
version: 2
name: cross-cutting-route-handlers-reserved-external-machine-1cad
description: "Next.js Server Actions and Route Handlers for Service Boundaries: Route Handlers Reserved External Machine Integrations"
metadata:
  actual:
    adr_id: 1cadfd41-c738-4d9c-a4a7-eec2354d047b
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

# Next.js Server Actions and Route Handlers for Service Boundaries: Route Handlers Reserved External Machine Integrations

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all client-to-server mutation operations, external webhook ingestion endpoints, and server-side data access procedures matching the configured scope.

### Rules

- **R-SB-001** MUST: Route handlers MUST be reserved for external machine-to-machine integrations, third-party webhooks, and protocol callback boundaries requiring standard HTTP request and response semantics.

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
Claude Code MUST NOT skip or defer verification. All pull requests bypassing server boundaries or performing unauthorized mutations will be blocked during code review.
</enforcement>