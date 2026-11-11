---
version: 2
name: cross-cutting-token-payload-parsing-invoke-parse-15fa
description: "Zod Runtime Schema Validation for Boundary Inputs: Token Payload Parsing Invoke Parse Method"
metadata:
  actual:
    adr_id: 15fa63ba-74c8-46b7-9e7c-fffe366f514c
    status: accepted
    candidate_group_id: 3e51a323-08e1-4a0e-90d8-0f0a7e8c37f1
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Zod Runtime Schema Validation for Boundary Inputs: Token Payload Parsing Invoke Parse Method

Scope: applies to `supabase/functions/tb-branch/**`.

These rules are ALWAYS ACTIVE for serverless edge functions and HTTP boundary endpoints accepting external request bodies, parameters, or token payloads, and token payload parsing routines decoding claims before authorization or context propagation.

### Rules

- **R-ZOD-001** MUST: Token and payload parsing MUST invoke the parse method or safeParse method on defined Zod schemas and MUST NOT pass unvalidated JSON data directly to downstream clients or services.

### Verify

```bash
# Discover and execute the project verification script from root configuration for static analysis and type checking across boundary handlers
# Discover and run the project test suite to verify boundary schemas reject invalid payloads and accept compliant data structures
```

**Accept when:**
- All boundary endpoints validate incoming payloads and token claims against declared Zod schemas with zero unhandled validation errors.
- Automated test suites confirm that malformed payloads return client error responses while valid structures pass through to domain logic.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>