---
version: 2
name: cross-cutting-modules-not-write-sensitive-session-f20c
description: "Runtime Environment Configuration Resolution via cli/config Module: Modules Not Write Sensitive Session Tokens"
metadata:
  actual:
    adr_id: f20ceec6-efae-4f2d-8adc-9f3c5d06fb05
    status: accepted
    candidate_group_id: 62b58543-54c7-4fab-9b08-385ef4b1414a
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Runtime Environment Configuration Resolution via cli/config Module: Modules Not Write Sensitive Session Tokens

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for runtime initialization routines requiring access to process environment variables and service components managing communication channels and external service endpoints.

### Rules

- **R-ADR-001** MUST_NOT: Modules MUST NOT write sensitive session tokens, credentials, or secret configuration values to unformatted standard log streams.

### Verify

```bash
# Discover the project test runner script from the repository manifest and execute the test suite covering runtime configuration resolution.
# Locate the repository linting and static analysis commands in the build configuration and execute them to ensure compliance with environment access policies.
```

**Accept when:**
- Configuration resolution tests pass with full verification of environment variable overrides and fallback paths.
- Static analysis reports zero unmediated environment variable accesses outside of authorized configuration modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>