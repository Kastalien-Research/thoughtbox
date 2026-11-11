---
version: 2
name: cross-cutting-unattended-execution-harnesses-configure-f8ba
description: "Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Unattended Execution Harnesses Configure Permissionmode Bypasspermissions"
metadata:
  actual:
    adr_id: f8baa406-ee5e-428c-935c-17cfc55f035f
    status: accepted
    candidate_group_id: b816a7fa-1162-426b-b76b-c53571da15ab
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Unattended Execution Harnesses Configure Permissionmode Bypasspermissions

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for programmatic agent execution harnesses, automated evaluation and probe scripts, and unattended agent utility runners.

### Rules

- **R-ADR-001** SHOULD: Unattended execution harnesses SHOULD configure permissionMode with bypassPermissions only when running in isolated or sandboxed environments where automated execution is necessary.
- **R-ADR-002** MANDATORY: Discover the dependency manifest in the repo to identify the build tool and inspect the repository lock or resolution artifact to determine the exact resolved version of `@anthropic-ai/claude-agent-sdk` before writing code that uses the library.
- **R-ADR-003** MANDATORY: Look up official documentation, changelog, or public API reference for the exact resolved version; do not use training-data recall.
- **R-ADR-004** MANDATORY: Always set finite execution boundaries on both maxTurns and maxBudgetUsd in invocation options to guarantee termination.
- **R-ADR-005** MANDATORY: Enforce minimal tool scopes via allowedTools and restrict script execution to containerized or controlled environments when using bypassPermissions.

### Verify

```bash
# Discover and run the project static analysis and type-checking scripts to verify query option schemas match library expectations.
# Discover and run the automated test suite targeting agent harnesses to ensure query execution terminates within defined constraints.
```

**Accept when:**
- Static analysis confirms all agent harness invocations adhere to the query option contracts of @anthropic-ai/claude-agent-sdk.
- Automated harness executions succeed non-interactively without encountering unbounded execution loops or unauthorized tool calls.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis checks and code review must enforce schema conformance, proper declaration of allowedTools, and mandatory turn or budget ceilings.
</enforcement>