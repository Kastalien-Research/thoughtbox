---
version: 2
name: cross-cutting-schema-definitions-boundary-contracts-de-3ae8
description: "Zod Runtime Schema Validation for Boundary Inputs: Schema Definitions Boundary Contracts Define Pagination"
metadata:
  actual:
    adr_id: 3ae80d29-36d6-4e1f-addf-0fa9f02fafe3
    status: accepted
    candidate_group_id: 3e51a323-08e1-4a0e-90d8-0f0a7e8c37f1
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Zod Runtime Schema Validation for Boundary Inputs: Schema Definitions Boundary Contracts Define Pagination

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for serverless edge functions and HTTP boundary endpoints accepting external request bodies, parameters, or token payloads.

### Rules

- **R-ZOD-001** SHOULD: Schema definitions for boundary contracts SHOULD define pagination parameters and numeric bounds to constrain resource utilization.

### Verify

```bash
# Discover and execute project verification and test scripts from root configuration
# to run static analysis, type checking, and boundary schema validation tests.
```

**Accept when:**
- All boundary endpoints validate incoming payloads and token claims against declared Zod schemas with zero unhandled validation errors.
- Automated test suites confirm that malformed payloads return client error responses while valid structures pass through to domain logic.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>