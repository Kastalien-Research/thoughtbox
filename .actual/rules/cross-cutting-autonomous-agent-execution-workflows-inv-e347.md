---
version: 2
name: cross-cutting-autonomous-agent-execution-workflows-inv-e347
description: "@anthropic-ai/claude-agent-sdk Agent Query Execution: Autonomous Agent Execution Workflows Invoke Anthropic"
metadata:
  actual:
    adr_id: e347d5cd-b79f-426c-8e18-a36f04aac9f0
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

# @anthropic-ai/claude-agent-sdk Agent Query Execution: Autonomous Agent Execution Workflows Invoke Anthropic

Scope: applies to `scripts/**`, `src/evaluation/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-AUT-001** MUST: Autonomous agent execution workflows MUST invoke the @anthropic-ai/claude-agent-sdk query function to coordinate model agent tasks.

### Verify

```bash
# Discover the project's test runner from repository configuration and execute tests covering agent query harnesses
# Discover the static analysis tool and run linting rules to validate query option configurations
```

**Accept when:**
- All static verification and type checks pass with zero errors across all agent execution harnesses.
- Invocations of query validate that required budget caps and tool allowlists are supplied prior to execution.

<enforcement>
Claude Code MUST NOT skip or defer verification. Code review verification of all query invocation options and static analysis rules checking for required budget and permission configurations must pass.
</enforcement>