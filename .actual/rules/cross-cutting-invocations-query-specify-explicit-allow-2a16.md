---
version: 2
name: cross-cutting-invocations-query-specify-explicit-allow-2a16
description: "@anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Query Specify Explicit Allowedtools Array"
metadata:
  actual:
    adr_id: 2a16cf1a-f91a-4f6c-80e3-68b95c396c81
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

# @anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Query Specify Explicit Allowedtools Array

Scope: applies to `scripts/**`, `src/evaluation/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SDK-001** MUST: Invocations of query MUST specify an explicit allowedTools array restricting accessible tools to those required for the designated task.

### Verify

```bash
# Discover the project's test runner from the repository configuration and execute tests covering agent query harnesses.
# Discover the static analysis tool and run linting rules to validate query option configurations.
```

**Accept when:**
- All static verification and type checks pass with zero errors across all agent execution harnesses.
- Invocations of query validate that required budget caps and tool allowlists are supplied prior to execution.

<enforcement>
Claude Code MUST NOT skip or defer verification. Code review verification and static analysis rules checking for required budget and permission configurations in agent runner modules must be applied, blocking pull requests omitting explicit tool allowlists or budget caps.
</enforcement>