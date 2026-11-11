---
version: 2
name: cross-cutting-client-boundary-handlers-not-expose-a3c1
description: "Fetch API for Internal Client Boundaries: Client Boundary Handlers Not Expose Sensitive"
metadata:
  actual:
    adr_id: a3c1521c-e0d3-4f2e-bd63-6b0c00956a95
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

# Fetch API for Internal Client Boundaries: Client Boundary Handlers Not Expose Sensitive

Scope: applies to `apps/web/src/app/**`, `apps/web/src/lib/merge/**`.

These rules are ALWAYS ACTIVE for internal API client utility modules and server-side/administrative workflows dispatching HTTP requests to backend service boundaries.

### Rules

- **R-CBH-001** MUST_NOT: Client boundary handlers MUST NOT expose sensitive administrative service role keys to publicly accessible client-side execution contexts.

### Verify

```bash
# Discover and run the project's static analysis and type verification checks to validate boundary client invocations.
# Discover and run the test suite covering internal boundary functions and HTTP integration mocks.
```

**Accept when:**
- All boundary HTTP requests pass type checks and parameter encoding assertions without errors.
- Static security checks confirm administrative authorization headers and service keys are isolated from public client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks validating static types and lint rules, and peer code review.
</enforcement>