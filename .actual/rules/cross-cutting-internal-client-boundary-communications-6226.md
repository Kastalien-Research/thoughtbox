---
version: 2
name: cross-cutting-internal-client-boundary-communications-6226
description: "Fetch API for Internal Client Boundaries: Internal Client Boundary Communications Use Fetch"
metadata:
  actual:
    adr_id: 6226b8f3-2fab-4c0a-8c58-e17006a69836
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

# Fetch API for Internal Client Boundaries: Internal Client Boundary Communications Use Fetch

Scope: applies to `apps/web/src/app/**`, `apps/web/src/lib/merge/**`.

These rules are ALWAYS ACTIVE for internal API client utility modules invoking application endpoints and server-side/administrative workflows dispatching HTTP requests to backend service boundaries.

### Rules

- **R-INT-001** MUST: All internal API client boundary communications MUST use the Fetch API for dispatching HTTP requests to internal endpoints and administrative service boundaries.
- **R-INT-002** MUST: Construct all parameterized URLs using URLSearchParams or encodeURIComponent to guarantee safe query string formatting.
- **R-INT-003** MUST: Encapsulate endpoint-specific request logic inside dedicated integration functions returning strongly typed domain representations.
- **R-INT-004** MUST: Enforce response ok checks and standardized error bubbling within all boundary helper functions.
- **R-INT-005** MUST: Restrict administrative boundary requests to server-executed contexts and validate environment variable scopes via continuous integration linting.

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