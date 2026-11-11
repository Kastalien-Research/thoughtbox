---
version: 2
name: cross-cutting-channel-components-enter-idle-state-315c
description: "Environment Variable Secret Ingestion for @modelcontextprotocol/sdk Server: Channel Components Enter Idle State When"
metadata:
  actual:
    adr_id: 315c594a-cb6a-453b-9e6a-9795c2896d24
    status: accepted
    candidate_group_id: b3388b5b-1c9d-429d-93b9-58994d5f2051
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Environment Variable Secret Ingestion for @modelcontextprotocol/sdk Server: Channel Components Enter Idle State When

Scope: applies to `plugins/thoughtbox-claude-code/src/**`.

These rules are ALWAYS ACTIVE for components establishing real-time communication channels using @modelcontextprotocol/sdk and modules managing session authentication credentials and connection endpoint configuration.

### Rules

- **R-ENV-001** MAY: Channel components MAY enter an idle state when optional credentials are not present if headless operation without credentials is supported.
- **R-ENV-002** MANDATORY: Consumers MUST derive all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-ENV-003** MANDATORY: Before writing code that uses a versioned library, execute the lock-version grounding steps in order (find manifest, identify build tool, inspect lock/resolution artifact, look up official docs for that exact version, confirm every API/class/function exists, re-run per dependency at point of use).
- **R-ENV-004** MANDATORY: Verify that configuration readers parse and validate all required authentication values prior to initializing channel servers.
- **R-ENV-005** MANDATORY: Ensure all logging sinks redact or omit sensitive session tokens during channel initialization and transport error handling.

### Verify

```bash
# Discover and run the project's static analysis and linting suites to ensure no unvalidated environment variable reads bypass configuration adapters.
# Discover and execute automated test suites validating credential resolution and missing configuration handling.
```

**Accept when:**
- All channel initialization routines reject invalid or missing session tokens without exposing secret values.
- Static analysis checks pass with zero reported violations of direct environment variable access rules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated security static analysis scans during continuous integration and peer code review verification against secrets management and credential handling guidelines.
</enforcement>