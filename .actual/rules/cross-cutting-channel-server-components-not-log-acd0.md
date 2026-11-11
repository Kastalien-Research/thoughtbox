---
version: 2
name: cross-cutting-channel-server-components-not-log-acd0
description: "Environment Variable Secret Ingestion for @modelcontextprotocol/sdk Server: Channel Server Components Not Log Expose"
metadata:
  actual:
    adr_id: acd02ae6-d09a-4b7a-b915-9880acce8299
    status: accepted
    candidate_group_id: b3388b5b-1c9d-429d-93b9-58994d5f2051
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Environment Variable Secret Ingestion for @modelcontextprotocol/sdk Server: Channel Server Components Not Log Expose

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CHNL-001** MUST_NOT: Channel server components MUST NOT log or expose raw secret values or session tokens in diagnostics or error reporting streams.

### Verify

```bash
# Discover and run the project's static analysis and linting suites to ensure no unvalidated environment variable reads bypass configuration adapters.
# Discover and execute automated test suites validating credential resolution and missing configuration handling.
```

**Accept when:**
- All channel initialization routines reject invalid or missing session tokens without exposing secret values.
- Static analysis checks pass with zero reported violations of direct environment variable access rules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>