---
version: 2
name: cross-cutting-route-handlers-not-implement-manual-e750
description: "Hono Framework Adoption for Service API Boundaries: Route Handlers Not Implement Manual Url"
metadata:
  actual:
    adr_id: e75062cb-87fb-4522-af2a-5fdfb8a053df
    status: accepted
    candidate_group_id: 77d2e008-c5df-4798-839d-67bc2661b838
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Hono Framework Adoption for Service API Boundaries: Route Handlers Not Implement Manual Url

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-HONO-001** MUST_NOT: Route handlers MUST_NOT implement manual URL path string slicing or manual HTTP method branching when equivalent Hono routing primitives are available.

### Verify

```bash
# Discover and execute the project test runner script defined in the repository manifest to verify route dispatch and HTTP response status codes.
# Discover and run the project static analysis and linting script to ensure all edge functions declare routes via the designated framework.
```

**Accept when:**
- All edge HTTP service endpoints are registered through Hono application instances with explicit HTTP verb bindings.
- All automated endpoint route integration and unit test suites execute and pass without errors.
- Static analysis confirms no raw manual URL path parsing logic exists in edge function request handlers.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration pipelines, static code analysis checks, and peer code reviews verify adherence.
</enforcement>