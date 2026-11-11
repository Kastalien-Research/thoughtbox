---
version: 2
name: cross-cutting-server-actions-coordinating-credential-i-a771
description: "API Key Credential Storage Using bcryptjs: Server Actions Coordinating Credential Issuance Extract"
metadata:
  actual:
    adr_id: a771ba32-cc5c-4057-a50c-b9fb8ff00f63
    status: accepted
    candidate_group_id: b38bd68f-3c56-4a4b-ae5e-f16262c601e3
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# API Key Credential Storage Using bcryptjs: Server Actions Coordinating Credential Issuance Extract

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ACT-001** SHOULD: Server actions coordinating credential issuance SHOULD extract input fields via formData.get and coordinate cache invalidation through next/cache only after successful credential persistence.

### Verify

```bash
# Discover and execute the project test runner to validate that credential hashing tests pass.
# Discover and execute the static analysis linter to confirm compliance with asynchronous hashing rules.
```

**Accept when:**
- All unit and integration tests for credential generation and hashing pass without failure.
- Static analysis checks verify that bcrypt.hash is invoked asynchronously with cost factor 12 and no plaintext keys are logged.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration test suites, static analysis checks, and peer code review.
</enforcement>