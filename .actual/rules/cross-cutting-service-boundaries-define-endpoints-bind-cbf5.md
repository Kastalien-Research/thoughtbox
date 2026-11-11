---
version: 2
name: cross-cutting-service-boundaries-define-endpoints-bind-cbf5
description: "Hono Framework Adoption for Service API Boundaries: Service Boundaries Define Endpoints Binding Explicit"
metadata:
  actual:
    adr_id: cbf5d3db-b60f-4e99-a42f-5732a0e4e7a2
    status: accepted
    candidate_group_id: 77d2e008-c5df-4798-839d-67bc2661b838
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Hono Framework Adoption for Service API Boundaries: Service Boundaries Define Endpoints Binding Explicit

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for serverless edge functions defining public or internal HTTP service endpoints and edge request handlers dispatching multiple HTTP methods or structured URL paths.

### Rules

- **R-HONO-001** MUST: Service boundaries MUST define endpoints by binding explicit HTTP verb methods on the Hono application instance rather than multiplexing requests within a monolithic handler.

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
Claude Code MUST NOT skip or defer verification. All pull requests containing raw request dispatcher logic or unapproved routing libraries are blocked until refactored to use the framework.
</enforcement>