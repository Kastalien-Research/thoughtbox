---
version: 2
name: cross-cutting-codebase-isolate-test-specification-call-82dd
description: "Unit Test Specification Structure via describe Function: Codebase Isolate Test Specification Calls Describe"
metadata:
  actual:
    adr_id: 82dd37e2-3c3e-4073-a2c4-77cd575d9cc0
    status: accepted
    candidate_group_id: 2a495342-30ff-49b3-add7-50c8832870f9
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Unit Test Specification Structure via describe Function: Codebase Isolate Test Specification Calls Describe

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for all unit test specifications, test suite definitions, and modules responsible for validating component behavior via assertion and test organization blocks.

### Rules

- **R-CODE-001** MUST: Isolate test specification calls using describe within dedicated test modules and MUST NOT execute test suite definitions inside runtime CLI modules.

### Verify

```bash
# Discover the project test execution script from repository metadata and run all unit test suites.
# Execute the repository static analysis and linting script to verify no test specification APIs are imported within production modules.
```

**Accept when:**
- All unit test suites execute and pass with zero failures.
- Static verification reports zero occurrences of test framework constructs within runtime CLI modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration pipeline execution, static analysis checks, and peer code review.
</enforcement>