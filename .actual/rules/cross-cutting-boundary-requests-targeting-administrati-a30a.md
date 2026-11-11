---
version: 2
name: cross-cutting-boundary-requests-targeting-administrati-a30a
description: "Fetch API for Internal Client Boundaries: Boundary Requests Targeting Administrative Authenticated Endpoints"
metadata:
  actual:
    adr_id: a30a0665-1192-4d14-a001-5437ebf957c7
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

# Fetch API for Internal Client Boundaries: Boundary Requests Targeting Administrative Authenticated Endpoints

Scope: applies to `apps/web/src/app/**`, `apps/web/src/lib/merge/**`.

These rules are ALWAYS ACTIVE for internal API client utility modules invoking application endpoints and server-side/administrative workflows dispatching HTTP requests to backend service boundaries.

### Rules

- **R-BOUNDARY-001** MUST: Boundary requests targeting administrative or authenticated endpoints MUST supply required authorization and API key credentials through designated HTTP headers rather than query strings.

### Verify

```bash
# Discover and run the project's static analysis and type verification checks to validate boundary client invocations.
# Discover and run the test suite covering internal boundary functions and HTTP integration mocks.
```

**Accept when:**
- All boundary HTTP requests pass type checks and parameter encoding assertions without errors.
- Static security checks confirm administrative authorization headers and service keys are isolated from public client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification. Pull requests containing unencoded query parameters or direct credential exposure in client contexts are blocked from merging until corrected.
</enforcement>