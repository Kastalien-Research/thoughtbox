---
version: 2
name: cross-cutting-schemas-structured-payloads-use-object-656e
description: "Zod Runtime Schema Validation for Boundary Inputs: Schemas Structured Payloads Use Object Explicit"
metadata:
  actual:
    adr_id: 656e3fec-19f4-4cc4-9a89-f9d374c8beab
    status: accepted
    candidate_group_id: 3e51a323-08e1-4a0e-90d8-0f0a7e8c37f1
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Zod Runtime Schema Validation for Boundary Inputs: Schemas Structured Payloads Use Object Explicit

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ZOD-001** MUST: Schemas for structured payloads MUST use z.object with explicit field constraints, including appropriate primitive types, default values, or optional and nullable declarations.

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