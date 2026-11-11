---
version: 2
name: cross-cutting-consumer-inspect-repository-lock-artifac-2590
description: "Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Consumer Inspect Repository Lock Artifact Determine"
metadata:
  actual:
    adr_id: 25905c5e-53ab-4b41-828a-ceeed7ca93d3
    status: accepted
    candidate_group_id: b816a7fa-1162-426b-b76b-c53571da15ab
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Consumer Inspect Repository Lock Artifact Determine

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for programmatic agent execution harnesses, automated evaluation and probe scripts, and unattended agent utility runners.

### Rules

- **R-CA-001** MUST: The consumer MUST inspect the repository lock artifact to determine the exact resolved version of @anthropic-ai/claude-agent-sdk before implementing or updating agent invocation routines.
- **R-CA-002** MUST: Derive all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-CA-003** MUST: Execute lock-version grounding in order: find dependency manifest, identify build tool, inspect repository lock/resolution artifact, look up official documentation for that exact version, confirm API/class/function existence, and re-run per dependency at point of use.
- **R-CA-004** MUST: Always set finite execution boundaries on both maxTurns and maxBudgetUsd in invocation options to guarantee termination.

### Verify

```bash
# Discover and run static analysis and type-checking scripts
npm run check || yarn check || pnpm check

# Run automated test suite targeting agent harnesses
npm test || yarn test || pnpm test
```

**Accept when:**
- Static analysis confirms all agent harness invocations adhere to the query option contracts of @anthropic-ai/claude-agent-sdk.
- Automated harness executions succeed non-interactively without encountering unbounded execution loops or unauthorized tool calls.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Block integration of code that invokes agent functionality without mandatory turn or budget ceilings, and flag/reject scripts enabling unvalidated permission bypass without bounded tool sets.
</enforcement>