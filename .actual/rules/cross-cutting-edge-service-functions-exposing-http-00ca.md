---
version: 2
name: cross-cutting-edge-service-functions-exposing-http-00ca
description: "Hono Framework Adoption for Service API Boundaries: Edge Service Functions Exposing Http Endpoints"
metadata:
  actual:
    adr_id: 00cad4b5-2e8e-4c97-be21-b93555ae4710
    status: accepted
    candidate_group_id: 77d2e008-c5df-4798-839d-67bc2661b838
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Hono Framework Adoption for Service API Boundaries: Edge Service Functions Exposing Http Endpoints

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-HONO-001** MUST: Edge service functions exposing HTTP endpoints MUST adopt the Hono framework to declare application boundaries and route HTTP requests.

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
Claude Code MUST NOT skip or defer verification.
</enforcement>