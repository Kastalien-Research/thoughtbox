---
version: 2
name: cross-cutting-boundary-handlers-encapsulate-fetch-invo-75a5
description: "Fetch API for Internal Client Boundaries: Boundary Handlers Encapsulate Fetch Invocations Within"
metadata:
  actual:
    adr_id: 75a581a6-8938-46ad-b466-eab46e790e64
    status: accepted
    candidate_group_id: 9b54c14c-ef8a-4460-b182-541bea7d9c8b
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/lib/merge/**
---

# Fetch API for Internal Client Boundaries: Boundary Handlers Encapsulate Fetch Invocations Within

Scope: applies to `apps/web/src/app/**`, `apps/web/src/lib/merge/**`.

These rules are ALWAYS ACTIVE for internal API client utility modules and server-side/administrative workflows dispatching HTTP requests to backend service boundaries.

### Rules

- **R-FETCH-001** SHOULD: Boundary handlers encapsulate Fetch API invocations within dedicated domain-specific integration helper functions rather than executing ad-hoc requests within presentation components.

### Verify

```bash
# Discover and run the project's static analysis and type verification checks to validate boundary client invocations.
# Discover and run the test suite covering internal boundary functions and HTTP integration mocks.
```

**Accept when:**
- All boundary HTTP requests pass type checks and parameter encoding assertions without errors.
- Static security checks confirm administrative authorization headers and service keys are isolated from public client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>