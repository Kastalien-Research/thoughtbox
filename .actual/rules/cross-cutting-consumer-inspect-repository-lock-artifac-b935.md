---
version: 2
name: cross-cutting-consumer-inspect-repository-lock-artifac-b935
description: "API Key Credential Storage Using bcryptjs: Consumer Inspect Repository Lock Artifact Identify"
metadata:
  actual:
    adr_id: b935c765-1256-4f12-a873-af831430b861
    status: accepted
    candidate_group_id: b38bd68f-3c56-4a4b-ae5e-f16262c601e3
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# API Key Credential Storage Using bcryptjs: Consumer Inspect Repository Lock Artifact Identify

Scope: applies to `apps/web/src/app/w/**`.

These rules are ALWAYS ACTIVE for server action handlers creating or updating workspace API keys and credential records, and server-side routines persisting secret credential tokens.

### Rules

- **R-API-001** MUST: The consumer MUST inspect the repository lock artifact to identify and verify the exact resolved version of bcryptjs prior to implementation.

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