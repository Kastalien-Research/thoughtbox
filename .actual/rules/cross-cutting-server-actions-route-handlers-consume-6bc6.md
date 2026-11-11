---
version: 2
name: cross-cutting-server-actions-route-handlers-consume-6bc6
description: "thoughtbox-config Module Adoption: Server Actions Route Handlers Consume Runtime"
metadata:
  actual:
    adr_id: 6bc6817b-5afd-4ed6-9e5c-a6bd1334cef8
    status: accepted
    candidate_group_id: 9e84744e-d14f-4855-a4cf-e8af7bb64f00
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# thoughtbox-config Module Adoption: Server Actions Route Handlers Consume Runtime

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for server actions, application page workflows, authentication routines, and onboarding components requiring application configuration.

### Rules

- **R-CFG-001** MUST: Server actions and route handlers MUST consume runtime options via the thoughtbox-config module rather than instantiating ad-hoc configuration objects.
- **R-CFG-002** MUST: Consumer modules must import configuration definitions through the centralized module path alias rather than navigating relative paths.
- **R-CFG-003** MUST: Validate all mandatory configuration parameters during module initialization to ensure immediate failure on misconfiguration.

### Verify

```bash
# Discover the workspace verification script in the project manifest and execute it
npm run verify
# Execute repository static analysis and linting check using the configured task runner
npm run lint
# Run the project test suite
npm test
```

**Accept when:**
- All imports of configuration resolve strictly through the centralized configuration module without unresolved reference errors.
- Static analysis checks pass with zero violations regarding unauthorized direct configuration access.
- Test suites pass successfully across all modules relying on the centralized configuration module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Code changes introducing direct environment reads or bypassing the configuration module are rejected at static analysis or code review.
</enforcement>