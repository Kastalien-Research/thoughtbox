---
version: 2
name: cross-cutting-invocations-enforcing-specialized-agent-3b35
description: "@anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Enforcing Specialized Agent Roles Provide"
metadata:
  actual:
    adr_id: 3b35a271-7d88-4a42-9acf-0a26b4e42e49
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

# @anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Enforcing Specialized Agent Roles Provide

Scope: applies to `scripts/**`, `src/evaluation/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SDK-001** SHOULD: Invocations enforcing specialized agent roles provide a structured systemPrompt configuration in query options.

### Verify

```bash
# Discover the project's test runner from the repository configuration and execute tests covering agent query harnesses.
# Discover the static analysis tool and run linting rules to validate query option configurations.
```

**Accept when:**
- All static verification and type checks pass with zero errors across all agent execution harnesses.
- Invocations of query validate that required budget caps and tool allowlists are supplied prior to execution.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>