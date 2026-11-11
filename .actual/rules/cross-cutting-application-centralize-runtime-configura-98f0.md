---
version: 2
name: cross-cutting-application-centralize-runtime-configura-98f0
description: "Runtime Environment Configuration Resolution via cli/config Module: Application Centralize Runtime Configuration Resolution Through"
metadata:
  actual:
    adr_id: 98f002f0-89d1-4434-8a34-31b40da10e74
    status: accepted
    candidate_group_id: 62b58543-54c7-4fab-9b08-385ef4b1414a
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Runtime Environment Configuration Resolution via cli/config Module: Application Centralize Runtime Configuration Resolution Through

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for runtime initialization routines requiring access to process environment variables and service components managing communication channels and external service endpoints (excluding static build-time constants, in-memory test fixtures, and bootstrap scripts executing prior to configuration module availability).

### Rules

- **R-CONFIG-001** MUST: The application MUST centralize runtime configuration resolution through the dedicated configuration module rather than performing ad-hoc environment variable inspection across separate modules.

### Verify

```bash
# Discover the project test runner script from the repository manifest and execute the test suite covering runtime configuration resolution.
# Locate the repository linting and static analysis commands in the build configuration and execute them to ensure compliance with environment access policies.
```

**Accept when:**
- Configuration resolution tests pass with full verification of environment variable overrides and fallback paths.
- Static analysis reports zero unmediated environment variable accesses outside of authorized configuration modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Direct environment variable access outside authorized configuration modules is blocked.
</enforcement>