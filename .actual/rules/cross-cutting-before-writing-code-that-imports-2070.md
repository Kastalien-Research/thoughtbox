---
version: 2
name: cross-cutting-before-writing-code-that-imports-2070
description: "Hono Framework Adoption for Service API Boundaries: Before Writing Code That Imports Updates"
metadata:
  actual:
    adr_id: 207095dc-d2a4-4201-8e70-bc4f99adba31
    status: accepted
    candidate_group_id: 77d2e008-c5df-4798-839d-67bc2661b838
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Hono Framework Adoption for Service API Boundaries: Before Writing Code That Imports Updates

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for serverless edge functions defining public or internal HTTP service endpoints and edge request handlers dispatching multiple HTTP methods or structured URL paths.

### Rules

- **R-HONO-001** MUST: Before writing code that imports or updates the routing framework, the consumer MUST inspect the repository lock artifact to determine and adhere to the exact resolved framework dependency version.

### Verify

```bash
# Discover and execute the project test runner script defined in the repository manifest
# Discover and run the project static analysis and linting script
```

**Accept when:**
- All edge HTTP service endpoints are registered through Hono application instances with explicit HTTP verb bindings.
- All automated endpoint route integration and unit test suites execute and pass without errors.
- Static analysis confirms no raw manual URL path parsing logic exists in edge function request handlers.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>