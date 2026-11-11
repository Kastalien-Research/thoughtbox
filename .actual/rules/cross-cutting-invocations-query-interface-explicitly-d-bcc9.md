---
version: 2
name: cross-cutting-invocations-query-interface-explicitly-d-bcc9
description: "Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Invocations Query Interface Explicitly Declare Allowedtools"
metadata:
  actual:
    adr_id: bcc9327e-ab6e-4718-a9b4-28d76985139f
    status: accepted
    candidate_group_id: b816a7fa-1162-426b-b76b-c53571da15ab
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Invocations Query Interface Explicitly Declare Allowedtools

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for programmatic agent execution harnesses, automated evaluation and probe scripts, and unattended agent utility runners.

### Rules

- **R-ADR-001** MUST: Invocations of the query interface MUST explicitly declare allowedTools restricted to the minimum required capability set for the agent task.

### Verify

```bash
# Discover and run the project static analysis and type-checking scripts to verify query option schemas match library expectations.
# Discover and run the automated test suite targeting agent harnesses to ensure query execution terminates within defined constraints.
```

**Accept when:**
- Static analysis confirms all agent harness invocations adhere to the query option contracts of @anthropic-ai/claude-agent-sdk.
- Automated harness executions succeed non-interactively without encountering unbounded execution loops or unauthorized tool calls.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>