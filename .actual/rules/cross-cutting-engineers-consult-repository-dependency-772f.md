---
version: 2
name: cross-cutting-engineers-consult-repository-dependency-772f
description: "Zod Runtime Schema Validation for Boundary Inputs: Engineers Consult Repository Dependency Manifest Lock"
metadata:
  actual:
    adr_id: 772f1379-435f-4d20-81a6-7597cb6821c9
    status: accepted
    candidate_group_id: 3e51a323-08e1-4a0e-90d8-0f0a7e8c37f1
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Zod Runtime Schema Validation for Boundary Inputs: Engineers Consult Repository Dependency Manifest Lock

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for serverless edge functions, HTTP boundary endpoints accepting external request bodies, parameters, or token payloads, and token payload parsing routines decoding claims before authorization or context propagation.

### Rules

- **R-ZOD-001** MUST: Engineers MUST consult the repository dependency manifest and lock artifact to verify the exact resolved version of Zod before referencing its validation APIs.

### Verify

```bash
# Discover the project verification script from the root configuration and execute static analysis and type checking across all boundary handlers.
# Discover and run the project test suite to verify that boundary schemas reject invalid payloads and accept compliant data structures.
```

**Accept when:**
- All boundary endpoints validate incoming payloads and token claims against declared Zod schemas with zero unhandled validation errors.
- Automated test suites confirm that malformed payloads return client error responses while valid structures pass through to domain logic.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration test suites and peer code reviews verify schema validation compliance.
</enforcement>