---
version: 2
name: cross-cutting-invocations-query-automated-workflows-co-bc3c
description: "@anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Query Automated Workflows Configure Permissionmode"
metadata:
  actual:
    adr_id: bc3c43ef-4003-4995-9a56-6d823b8f1eca
    status: accepted
    candidate_group_id: 1dc656d5-f6af-4759-8d9d-545af3c26b3b
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/evaluation/**
      - src/sessions/**
---

# @anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Query Automated Workflows Configure Permissionmode

Scope: applies to `scripts/**`, `src/evaluation/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-CA-001** MUST: Invocations of query in automated workflows MUST configure permissionMode as bypassPermissions to permit headless execution without blocking on interactive prompts.

### Verify

```bash
# Discover the project's test runner from the repository configuration and execute tests covering agent query harnesses.
# Discover the static analysis tool and run linting rules to validate query option configurations.
```

**Accept when:**
- All static verification and type checks pass with zero errors across all agent execution harnesses.
- Invocations of query validate that required budget caps and tool allowlists are supplied prior to execution.

<enforcement>
Claude Code MUST NOT skip or defer verification. Code review and static analysis rules check for required budget and permission configurations in agent runner modules.
</enforcement>