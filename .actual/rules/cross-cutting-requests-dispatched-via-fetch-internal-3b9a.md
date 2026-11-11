---
version: 2
name: cross-cutting-requests-dispatched-via-fetch-internal-3b9a
description: "Fetch API for Internal Client Boundaries: Requests Dispatched Via Fetch Internal Json"
metadata:
  actual:
    adr_id: 3b9afcc6-9498-458b-9c1a-64e7edce4392
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

# Fetch API for Internal Client Boundaries: Requests Dispatched Via Fetch Internal Json

Scope: applies to `apps/web/src/app/**`, `apps/web/src/lib/merge/**`.

These rules are ALWAYS ACTIVE for internal API client utility modules and server-side/administrative workflows dispatching HTTP requests to backend service boundaries.

### Rules

- **R-FAB-001** MUST: Requests dispatched via the Fetch API to internal JSON endpoints MUST explicitly set the accept header to application/json.

### Verify

```bash
# Discover and run the project's static analysis and type verification checks to validate boundary client invocations.
# Discover and run the test suite covering internal boundary functions and HTTP integration mocks.
```

**Accept when:**
- All boundary HTTP requests pass type checks and parameter encoding assertions without errors.
- Static security checks confirm administrative authorization headers and service keys are isolated from public client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification. All boundary HTTP requests must enforce strict header configuration, proper query parameter serialization, and secure credential handling.
</enforcement>