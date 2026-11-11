---
version: 2
name: cross-cutting-when-adopting-versioned-dependencies-suc-a6a1
description: "Environment Variable Secret Ingestion for @modelcontextprotocol/sdk Server: When Adopting Versioned Dependencies Such Modelcontextprotocol"
metadata:
  actual:
    adr_id: a6a15fdb-accd-4be9-aa0b-8e0b8078c886
    status: accepted
    candidate_group_id: b3388b5b-1c9d-429d-93b9-58994d5f2051
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Environment Variable Secret Ingestion for @modelcontextprotocol/sdk Server: When Adopting Versioned Dependencies Such Modelcontextprotocol

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for components establishing real-time communication channels using @modelcontextprotocol/sdk and modules managing session authentication credentials and connection endpoint configuration.

### Rules

- **R-ENV-001** MUST: When adopting versioned dependencies such as @modelcontextprotocol/sdk, the consumer MUST inspect repository lock artifacts to verify the resolved version before implementation.
- **R-ENV-002** MUST: Configuration readers MUST parse and validate all required authentication values prior to initializing channel servers.
- **R-ENV-003** MUST: All logging sinks MUST redact or omit sensitive session tokens during channel initialization and transport error handling.

### Verify

```bash
# Discover and run the project's static analysis and linting suites to ensure no unvalidated environment variable reads bypass configuration adapters.
# Discover and execute automated test suites validating credential resolution and missing configuration handling.
npm test
npm run lint
```

**Accept when:**
- All channel initialization routines reject invalid or missing session tokens without exposing secret values.
- Static analysis checks pass with zero reported violations of direct environment variable access rules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated security static analysis scans and peer code review verification apply.
</enforcement>