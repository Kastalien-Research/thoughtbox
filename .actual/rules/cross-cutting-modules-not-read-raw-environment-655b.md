---
version: 2
name: cross-cutting-modules-not-read-raw-environment-655b
description: "thoughtbox-config Module Adoption: Modules Not Read Raw Environment Sources"
metadata:
  actual:
    adr_id: 655b3350-f9c4-4d4a-bcf0-326cd40bf263
    status: accepted
    candidate_group_id: 9e84744e-d14f-4855-a4cf-e8af7bb64f00
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# thoughtbox-config Module Adoption: Modules Not Read Raw Environment Sources

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TBX-001** MUST_NOT: Modules MUST NOT read raw environment sources directly when corresponding configurations are exposed by the thoughtbox-config module.

### Verify

```bash
# Discover and execute the workspace verification script
# Run repository static analysis and linting checks using the configured task runner
# Run the project test suite
```

**Accept when:**
- All imports of configuration resolve strictly through the centralized configuration module without unresolved reference errors.
- Static analysis checks pass with zero violations regarding unauthorized direct configuration access.
- Test suites pass successfully across all modules relying on the centralized configuration module.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>