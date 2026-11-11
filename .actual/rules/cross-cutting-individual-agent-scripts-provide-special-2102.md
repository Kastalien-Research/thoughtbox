---
version: 2
name: cross-cutting-individual-agent-scripts-provide-special-2102
description: "Adoption of run-agent-util Shared Module for Agent Script Execution: Individual Agent Scripts Provide Specialized Prompt"
metadata:
  actual:
    adr_id: 21026fda-f7dc-4a4d-aee0-5e5d060f64d8
    status: accepted
    candidate_group_id: dbcbf6f3-19d4-45d2-ae7b-6c709b902874
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/agents/**
---

# Adoption of run-agent-util Shared Module for Agent Script Execution: Individual Agent Scripts Provide Specialized Prompt

Scope: applies to `scripts/agents/**`.

These rules are ALWAYS ACTIVE for all autonomous agent automation scripts designed to invoke agent workflows, parse command-line arguments, and enforce budget constraints.

### Rules

- **R-AGNT-001** MAY: Individual agent scripts MAY provide specialized prompt structures, system prompt appendages, or tool allowances to configure their invocation through the shared utility.
- **R-AGNT-002** MANDATORY: Consumers MUST derive tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-AGNT-003** MANDATORY: Before writing code that uses a versioned library, the consumer MUST follow the lock-version grounding process: find manifest, identify build tool, inspect lock/resolution artifact, look up official documentation for that exact version, confirm API existence, and re-verify per dependency at point of use.
- **R-AGNT-004** MANDATORY: Consume runtime coordination functions directly from the shared utility module when configuring agent prompts and budget parameters.
- **R-AGNT-005** MANDATORY: Isolate agent-specific prompts, tool allowances, and model configurations in the consuming script while delegating dispatching to the shared utility.

### Verify

```bash
# Discover the project's test runner and static analysis scripts from the dependency manifest, then execute the verification suite
test_runner=$(npm test --if-present || pytest --version &>/dev/null && echo "pytest")
if [ -n "$test_runner" ]; then
  $test_runner
fi

# Discover the repository's structural validation command and execute it
if command -v cargo &>/dev/null && [ -f Cargo.toml ]; then
  cargo check
elif [ -f package.json ]; then
  npm run lint --if-present
fi
```

**Accept when:**
- All agent automation scripts resolve their execution lifecycle and runner functions through the internal run-agent-util shared module without dependency errors.
- Static analysis and automated test suites confirm zero duplicate agent execution boilerplate or redundant argument parsing routines across agent scripts.

<enforcement>
Claude Code MUST NOT skip or defer verification. All additions or updates to agent automation scripts are verified by automated static analysis, module boundary checks, and peer code review.
</enforcement>