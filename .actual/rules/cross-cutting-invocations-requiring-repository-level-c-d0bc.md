---
version: 2
name: cross-cutting-invocations-requiring-repository-level-c-d0bc
description: "@anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Requiring Repository Level Context Configure"
metadata:
  actual:
    adr_id: d0bc115c-eb4b-4376-8c2f-30c59cae555d
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

# @anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Requiring Repository Level Context Configure

Scope: applies to `scripts/**`, `src/evaluation/**`, `src/sessions/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SDK-001** SHOULD: Invocations requiring repository-level context SHOULD configure settingSources to load project settings.

### Verify

```bash
# Discover and execute project test suite covering agent query harnesses
# Discover and run static analysis / linting tools to validate query option configurations
```

**Accept when:**
- All static verification and type checks pass with zero errors across all agent execution harnesses.
- Invocations of query validate that required budget caps and tool allowlists are supplied prior to execution.

<enforcement>
Claude Code MUST NOT skip or defer verification. Code review verification, static analysis checks, and explicit budget/permission configurations are mandatory for all agent runner modules.
</enforcement>