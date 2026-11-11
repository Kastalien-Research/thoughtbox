---
version: 2
name: cross-cutting-query-parameters-passed-fetch-boundary-a9dd
description: "Fetch API for Internal Client Boundaries: Query Parameters Passed Fetch Boundary Requests"
metadata:
  actual:
    adr_id: a9dd7005-4e7c-434d-931f-29895b91c464
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

# Fetch API for Internal Client Boundaries: Query Parameters Passed Fetch Boundary Requests

Scope: applies to `apps/web/src/app/**`, `apps/web/src/lib/merge/**`.

These rules are ALWAYS ACTIVE for internal API client utility modules and server-side/administrative workflows dispatching HTTP requests to backend service boundaries.

### Rules

- **R-FETCH-001** MUST: All query parameters passed to Fetch API boundary requests MUST be serialized using URL parameter encoders to prevent query injection and malformed URI sequences.

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