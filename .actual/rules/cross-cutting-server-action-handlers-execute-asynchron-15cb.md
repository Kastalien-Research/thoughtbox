---
version: 2
name: cross-cutting-server-action-handlers-execute-asynchron-15cb
description: "API Key Credential Storage Using bcryptjs: Server Action Handlers Execute Asynchronous Bcrypt"
metadata:
  actual:
    adr_id: 15cb7cf7-493f-4e1f-82c6-3f1cb2ca6c1f
    status: accepted
    candidate_group_id: b38bd68f-3c56-4a4b-ae5e-f16262c601e3
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# API Key Credential Storage Using bcryptjs: Server Action Handlers Execute Asynchronous Bcrypt

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-BCRYPT-001** MUST: Server action handlers MUST execute the asynchronous bcrypt.hash API rather than synchronous hashing variants to avoid blocking the server event loop during key hashing.

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