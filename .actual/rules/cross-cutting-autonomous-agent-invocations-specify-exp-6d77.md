---
version: 2
name: cross-cutting-autonomous-agent-invocations-specify-exp-6d77
description: "Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Autonomous Agent Invocations Specify Explicit Termination"
metadata:
  actual:
    adr_id: 6d77e713-8b33-4ad5-9134-ee93fe99c488
    status: accepted
    candidate_group_id: b816a7fa-1162-426b-b76b-c53571da15ab
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Autonomous Agent Invocations Specify Explicit Termination

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-AUT-001** MUST: Autonomous agent invocations MUST specify explicit termination bounds, including maxTurns and maxBudgetUsd, to prevent unbounded resource consumption.

### Verify

```bash
# Discover and run the project static analysis and type-checking scripts
# (Discover exact commands from project package manifest)
```

**Accept when:**
- Static analysis confirms all agent harness invocations adhere to the query option contracts of the agent SDK.
- Automated harness executions succeed non-interactively without encountering unbounded execution loops or unauthorized tool calls.

<enforcement>
Claude Code MUST NOT skip or defer verification. All agent harness invocations must be statically verified to include mandatory turn and budget ceilings.
</enforcement>