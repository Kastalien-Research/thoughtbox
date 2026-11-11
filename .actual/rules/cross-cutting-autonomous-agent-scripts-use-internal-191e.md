---
version: 2
name: cross-cutting-autonomous-agent-scripts-use-internal-191e
description: "Adoption of run-agent-util Shared Module for Agent Script Execution: Autonomous Agent Scripts Use Internal Run"
metadata:
  actual:
    adr_id: 191e42e7-b51b-4e3e-9218-6c259ae913eb
    status: accepted
    candidate_group_id: dbcbf6f3-19d4-45d2-ae7b-6c709b902874
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/agents/**
---

# Adoption of run-agent-util Shared Module for Agent Script Execution: Autonomous Agent Scripts Use Internal Run

Scope: applies to `scripts/agents/**`.

These rules are ALWAYS ACTIVE for all autonomous agent automation scripts designed to invoke agent workflows, parse command-line arguments, and enforce budget constraints.

### Rules

- **R-AGENT-001** MUST: Autonomous agent scripts MUST use the internal run-agent-util shared module for agent execution orchestration, argument extraction, and runtime coordination.

### Verify

```bash
# Discover the project's test runner and static analysis scripts from the dependency manifest, then execute the suite that verifies imports of the internal shared runner module across agent scripts.
# Discover the repository's structural validation command and execute it to verify that all agent runner scripts resolve dependencies through the shared utility module.
```

**Accept when:**
- All agent automation scripts resolve their execution lifecycle and runner functions through the internal run-agent-util shared module without dependency errors.
- Static analysis and automated test suites confirm zero duplicate agent execution boilerplate or redundant argument parsing routines across agent scripts.

<enforcement>
Claude Code MUST NOT skip or defer verification. All additions or updates to agent automation scripts are verified by automated static analysis and module boundary checks during continuous integration as well as peer code review.
</enforcement>