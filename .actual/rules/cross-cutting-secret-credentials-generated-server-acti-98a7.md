---
version: 2
name: cross-cutting-secret-credentials-generated-server-acti-98a7
description: "API Key Credential Storage Using bcryptjs: Secret Credentials Generated Server Action Boundaries"
metadata:
  actual:
    adr_id: 98a79696-253c-4e22-b89b-c3b42c6a2175
    status: accepted
    candidate_group_id: b38bd68f-3c56-4a4b-ae5e-f16262c601e3
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# API Key Credential Storage Using bcryptjs: Secret Credentials Generated Server Action Boundaries

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for server action handlers creating or updating workspace API keys and credential records, and server-side routines persisting secret credential tokens.

### Rules

- **R-SEC-001** MUST: All secret credentials generated at server action boundaries MUST be cryptographically hashed using bcryptjs through bcrypt.hash with a minimum work factor of 12 salt rounds before database persistence.

### Verify

```bash
# Discover and execute the project test runner to validate that credential hashing tests pass.
# Discover and execute the static analysis linter to confirm compliance with asynchronous hashing rules.
```

**Accept when:**
- All unit and integration tests for credential generation and hashing pass without failure.
- Static analysis checks verify that bcrypt.hash is invoked asynchronously with cost factor 12 and no plaintext keys are logged.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>