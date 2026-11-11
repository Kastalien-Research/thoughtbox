---
version: 2
name: cross-cutting-application-components-server-routines-r-64bf
description: "thoughtbox-config Module Adoption: Application Components Server Routines Requiring Shared"
metadata:
  actual:
    adr_id: 64bf24d1-3d85-476b-8362-c9f3c2990f23
    status: accepted
    candidate_group_id: 9e84744e-d14f-4855-a4cf-e8af7bb64f00
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# thoughtbox-config Module Adoption: Application Components Server Routines Requiring Shared

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-THOUGHTBOX-CFG-001** MUST: All application components and server routines requiring shared configuration MUST import settings exclusively through the thoughtbox-config internal module.

### Verify

```bash
# Discover and execute the workspace verification script
# Execute repository static analysis and linting check using the configured task runner
# Run the project test suite
```

**Accept when:**
- All imports of configuration resolve strictly through the centralized configuration module without unresolved reference errors.
- Static analysis checks pass with zero violations regarding unauthorized direct configuration access.
- Test suites pass successfully across all modules relying on the centralized configuration module.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>