---
version: 2
name: cross-cutting-before-writing-code-client-library-6f63
description: "Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Before Writing Code Client Library Consumers"
metadata:
  actual:
    adr_id: 6f637617-5716-4c08-834e-6e99e84379fd
    status: accepted
    candidate_group_id: 62d1546e-93ee-41c9-99f3-d8361e4129f5
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - middleware.ts
      - src/app/**
      - src/components/session-area/**
      - src/lib/**
---

# Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Before Writing Code Client Library Consumers

Scope: applies to `apps/web/middleware.ts`, `apps/web/src/app/**`, `apps/web/src/components/session-area/**`, `apps/web/src/lib/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUPA-001** MUST: Before writing code using the client library, consumers MUST discover the project dependency manifest and resolve the exact locked version of the client packages from the repository resolution artifact.

### Verify

```bash
# Discover the project verification scripts in the repository manifest and execute the test runner to validate primary datastore client instantiation.
# Discover the repository type-checking and linting configurations and execute the static analyzer across all server routes and actions to verify compliant createClient invocations.
```

**Accept when:**
- All server routes, server actions, and middleware instantiate primary datastore clients using createClient without manual connection setup.
- Static type analysis and repository verification scripts pass with zero errors across all server data access modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks and peer code reviews.
</enforcement>