---
version: 2
name: cross-cutting-external-payloads-query-parameters-decod-7ead
description: "Zod Runtime Schema Validation for Boundary Inputs: External Payloads Query Parameters Decoded Token"
metadata:
  actual:
    adr_id: 7ead7093-d087-4037-b8e7-72a79ff42654
    status: accepted
    candidate_group_id: 3e51a323-08e1-4a0e-90d8-0f0a7e8c37f1
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Zod Runtime Schema Validation for Boundary Inputs: External Payloads Query Parameters Decoded Token

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for all boundary endpoints and serverless functions receiving untrusted structured payloads, query parameters, and decoded tokens.

### Rules

- **R-ZOD-001** MUST: All external payloads, query parameters, and decoded token payloads arriving at boundary endpoints MUST be parsed and validated using Zod schemas before consumption by domain logic.
- **R-ZOD-002** EXCEPTION: A high-throughput binary streaming endpoint processes raw byte streams where schema parsing introduces prohibitive latency (EXC-42-001).

### Verify

```bash
# Discover the project verification script from the root configuration and execute static analysis and type checking across all boundary handlers.
# Discover and run the project test suite to verify that boundary schemas reject invalid payloads and accept compliant data structures.
```

**Accept when:**
- All boundary endpoints validate incoming payloads and token claims against declared Zod schemas with zero unhandled validation errors.
- Automated test suites confirm that malformed payloads return client error responses while valid structures pass through to domain logic.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>