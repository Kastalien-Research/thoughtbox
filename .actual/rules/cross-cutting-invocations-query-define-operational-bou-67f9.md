---
version: 2
name: cross-cutting-invocations-query-define-operational-bou-67f9
description: "@anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Query Define Operational Boundaries Setting"
metadata:
  actual:
    adr_id: 67f985d2-8c76-4c55-aea8-78a321e0a4a1
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

# @anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Query Define Operational Boundaries Setting

Scope: applies to `scripts/**`, `src/evaluation/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-AGENT-001** MUST: Invocations of query MUST define operational boundaries by setting maxBudgetUsd or maxTurns in options.

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