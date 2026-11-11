---
version: 2
name: cross-cutting-consuming-scripts-delegate-execution-bud-f6a2
description: "Adoption of run-agent-util Shared Module for Agent Script Execution: Consuming Scripts Delegate Execution Budget Validation"
metadata:
  actual:
    adr_id: f6a2e238-99f4-4414-82fc-4fb439ef3193
    status: accepted
    candidate_group_id: dbcbf6f3-19d4-45d2-ae7b-6c709b902874
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/agents/**
---

# Adoption of run-agent-util Shared Module for Agent Script Execution: Consuming Scripts Delegate Execution Budget Validation

Scope: applies to `scripts/agents/**`.

These rules are ALWAYS ACTIVE for all autonomous agent automation scripts designed to invoke agent workflows, parse command-line arguments, and enforce budget constraints.

### Rules

- **R-AUT-001** SHOULD: Consuming scripts delegate execution budget validation and default parameter enforcement directly to shared utility functions.
- **R-AUT-002** MANDATORY: The consumer MUST discover tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-AUT-003** MANDATORY: Before writing code that uses a versioned library, execute in order: find the dependency manifest, identify the build tool, inspect the repository lock or resolution artifact for the exact resolved version, look up official documentation for that exact version, confirm every API/class/function exists in that version, and re-verify per dependency at point of use for version-sensitive behavior.
- **R-AUT-004** MANDATORY: Consume runtime coordination functions directly from the shared utility module when configuring agent prompts and budget parameters.
- **R-AUT-005** MANDATORY: Isolate agent-specific prompts, tool allowances, and model configurations in the consuming script while delegating dispatching to the shared utility.

### Verify

```bash
# Discover and execute the project's test runner and static analysis scripts that verify imports of the internal shared runner module
# Discover and execute the repository's structural validation command to verify all agent runner scripts resolve dependencies through the shared utility module
```

**Accept when:**
- All agent automation scripts resolve their execution lifecycle and runner functions through the internal run-agent-util shared module without dependency errors.
- Static analysis and automated test suites confirm zero duplicate agent execution boilerplate or redundant argument parsing routines across agent scripts.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated static analysis and module boundary checks.
</enforcement>