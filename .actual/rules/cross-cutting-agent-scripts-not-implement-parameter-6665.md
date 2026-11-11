---
version: 2
name: cross-cutting-agent-scripts-not-implement-parameter-6665
description: "Adoption of run-agent-util Shared Module for Agent Script Execution: Agent Scripts Not Implement Parameter Extraction"
metadata:
  actual:
    adr_id: 6665b3be-6043-491e-bb68-12cfa4925acd
    status: accepted
    candidate_group_id: dbcbf6f3-19d4-45d2-ae7b-6c709b902874
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/agents/**
---

# Adoption of run-agent-util Shared Module for Agent Script Execution: Agent Scripts Not Implement Parameter Extraction

Scope: applies to `scripts/agents/**`.

These rules are ALWAYS ACTIVE for all autonomous agent automation scripts designed to invoke agent workflows, parse command-line arguments, and enforce budget constraints.

### Rules

- **R-RUN-001** MUST_NOT: Agent scripts MUST_NOT re-implement parameter extraction, budget normalization, or execution lifecycle routines that are provided by the shared module.

### Verify

```bash
# Discover the project's test runner and static analysis scripts from the dependency manifest, then execute the suite that verifies imports of the internal shared runner module across agent scripts.
# Discover the repository's structural validation command and execute it to verify that all agent runner scripts resolve dependencies through the shared utility module.
```

**Accept when:**
- All agent automation scripts resolve their execution lifecycle and runner functions through the internal run-agent-util shared module without dependency errors.
- Static analysis and automated test suites confirm zero duplicate agent execution boilerplate or redundant argument parsing routines across agent scripts.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated static analysis and peer code review enforce module boundary compliance, blocking PRs containing duplicated runner logic.
</enforcement>