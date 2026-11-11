---
version: 2
name: cross-cutting-runtime-error-reporting-mechanisms-cli-e671
description: "Unit Test Specification Structure via describe Function: Runtime Error Reporting Mechanisms Cli Modules"
metadata:
  actual:
    adr_id: e6711367-290c-417c-ba5c-52e879fcc520
    status: accepted
    candidate_group_id: 2a495342-30ff-49b3-add7-50c8832870f9
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Unit Test Specification Structure via describe Function: Runtime Error Reporting Mechanisms Cli Modules

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for all unit test specifications, test suite definitions, and CLI modules responsible for component behavior validation across the repository.

### Rules

- **R-CLI-001** MUST_NOT: Runtime error reporting mechanisms in CLI modules MUST NOT rely on unit testing assertion or specification APIs.
- **R-CLI-002** MANDATORY: Ensure test suite definitions utilizing describe functions reside strictly within repository paths targeted by the project test discovery configuration.
- **R-CLI-003** MANDATORY: Validate that runtime error formatting in CLI modules uses standard error handling constructs rather than test specification blocks.
- **R-CLI-004** MANDATORY: Execute dependency lock-version grounding (discovering manifest, build tool, inspecting lock artifact, checking official documentation, confirming APIs, and re-running per dependency at point of use) before writing code that uses a versioned library.

### Verify

```bash
# Discover the project test execution script from repository metadata and run all unit test suites.
# Execute the repository static analysis and linting script to verify no test specification APIs are imported within production modules.
```

**Accept when:**
- All unit test suites execute and pass with zero failures.
- Static verification reports zero occurrences of test framework constructs within runtime CLI modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Violation handling: Pull requests containing test specification blocks in runtime source files must be rejected and refactored prior to merge.
</enforcement>