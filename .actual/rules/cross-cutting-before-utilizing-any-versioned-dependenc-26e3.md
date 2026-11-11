---
version: 2
name: cross-cutting-before-utilizing-any-versioned-dependenc-26e3
description: "Fetch API for Internal Client Boundaries: Before Utilizing Any Versioned Dependency Transport"
metadata:
  actual:
    adr_id: 26e30fbe-1a89-4f96-bcc2-c35bbce99b03
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

# Fetch API for Internal Client Boundaries: Before Utilizing Any Versioned Dependency Transport

Scope: applies to `apps/web/src/app/**`, `apps/web/src/lib/merge/**`.

These rules are ALWAYS ACTIVE for internal API client utility modules and server-side/administrative workflows dispatching HTTP requests to backend service boundaries.

### Rules

- **R-FETCH-001** MUST: Before utilizing any versioned dependency for API transport or middleware, the consumer MUST inspect the repository lock artifact and verify the exact resolved version.
- **R-FETCH-002** MUST: Construct all parameterized URLs using URLSearchParams or encodeURIComponent to guarantee safe query string formatting.
- **R-FETCH-003** MUST: Encapsulate endpoint-specific request logic inside dedicated integration functions returning strongly typed domain representations.

### Verify

```bash
# Discover and run the project's dependency manifest inspection and lock verification
# Discover and run static analysis and type verification checks to validate boundary client invocations
# Discover and run the test suite covering internal boundary functions and HTTP integration mocks
```

**Accept when:**
- All boundary HTTP requests pass type checks and parameter encoding assertions without errors.
- Static security checks confirm administrative authorization headers and service keys are isolated from public client bundles.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Pull requests containing unencoded query parameters or direct credential exposure in client contexts are blocked from merging until corrected.
</enforcement>