---
version: 2
name: cross-cutting-plaintext-credential-values-not-written-3a41
description: "API Key Credential Storage Using bcryptjs: Plaintext Credential Values Not Written Persistent"
metadata:
  actual:
    adr_id: 3a4141ec-4896-42cb-9a7d-c1b652b0d13e
    status: accepted
    candidate_group_id: b38bd68f-3c56-4a4b-ae5e-f16262c601e3
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# API Key Credential Storage Using bcryptjs: Plaintext Credential Values Not Written Persistent

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-AKC-001** MUST_NOT: Plaintext credential values MUST NOT be written to persistent storage, cache layers, or logged within server action execution contexts.

### Verify

```bash
# Discover and execute the project test runner to validate that credential hashing tests pass.
# Discover and execute the static analysis linter to confirm compliance with asynchronous hashing rules.
```

**Accept when:**
- All unit and integration tests for credential generation and hashing pass without failure.
- Static analysis checks verify that bcrypt.hash is invoked asynchronously with cost factor 12 and no plaintext keys are logged.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>