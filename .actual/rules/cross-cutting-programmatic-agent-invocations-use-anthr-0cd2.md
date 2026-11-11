---
version: 2
name: cross-cutting-programmatic-agent-invocations-use-anthr-0cd2
description: "Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Programmatic Agent Invocations Use Anthropic Claude"
metadata:
  actual:
    adr_id: 0cd22b31-afdf-4f0b-b1a0-e663798c98bb
    status: accepted
    candidate_group_id: b816a7fa-1162-426b-b76b-c53571da15ab
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Programmatic Agent Invocations Use Anthropic Claude

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-ADR-001** MUST: Programmatic agent invocations MUST use @anthropic-ai/claude-agent-sdk through its query interface for autonomous execution.

### Verify

```bash
# Discover and run the project static analysis and type-checking scripts
# Example discovery based on project manifest:
# npm run typecheck || npx tsc --noEmit

# Run the automated test suite targeting agent harnesses
# npm test
```

**Accept when:**
- Static analysis confirms all agent harness invocations adhere to the query option contracts of @anthropic-ai/claude-agent-sdk.
- Automated harness executions succeed non-interactively without encountering unbounded execution loops or unauthorized tool calls.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>