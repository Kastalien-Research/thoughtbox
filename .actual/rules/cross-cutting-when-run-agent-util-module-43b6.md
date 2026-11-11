---
version: 2
name: cross-cutting-when-run-agent-util-module-43b6
description: "Adoption of run-agent-util Shared Module for Agent Script Execution: When Run Agent Util Module Consuming"
metadata:
  actual:
    adr_id: 43b69569-b9b0-455e-8e3e-c0bb39c6c578
    status: accepted
    candidate_group_id: dbcbf6f3-19d4-45d2-ae7b-6c709b902874
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/agents/**
---

# Adoption of run-agent-util Shared Module for Agent Script Execution: When Run Agent Util Module Consuming

Scope: applies to `scripts/agents/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-AGENT-001** MUST: When the run-agent-util module or consuming scripts interact with versioned external dependencies, consumers MUST inspect the repository lock artifact to determine exact resolved versions prior to integration.

### Verify

```bash
# Discover and execute project test runner / static analysis verifying internal shared runner imports
TEST_CMD=$(npm test || yarn test || pnpm test || cargo test || pytest)
$TEST_CMD
```

**Accept when:**
- All agent automation scripts resolve their execution lifecycle and runner functions through the internal run-agent-util shared module without dependency errors.
- Static analysis and automated test suites confirm zero duplicate agent execution boilerplate or redundant argument parsing routines across agent scripts.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>