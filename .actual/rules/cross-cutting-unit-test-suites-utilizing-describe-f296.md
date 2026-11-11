---
version: 2
name: cross-cutting-unit-test-suites-utilizing-describe-f296
description: "Unit Test Specification Structure via describe Function: Unit Test Suites Utilizing Describe Blocks"
metadata:
  actual:
    adr_id: f2968bf4-cad2-4dd3-aec6-1a7fe28affa5
    status: accepted
    candidate_group_id: 2a495342-30ff-49b3-add7-50c8832870f9
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Unit Test Specification Structure via describe Function: Unit Test Suites Utilizing Describe Blocks

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for unit test specifications and test suite definitions across the repository, as well as modules responsible for validating component behavior via assertion and test organization blocks.

### Rules

- **R-UTS-001** SHOULD: Unit test suites utilizing describe blocks SHOULD maintain hierarchical structuring separating suite setup from unit assertion execution.
- **R-UTS-002** MANDATORY: Unit test suite definitions utilizing describe functions MUST reside strictly within repository paths targeted by the project test discovery configuration.
- **R-UTS-003** MANDATORY: Runtime error formatting in CLI modules MUST use standard error handling constructs rather than test specification blocks.

### Verify

```bash
# Discover the project test execution script from repository metadata and run all unit test suites.
npm test

# Execute the repository static analysis and linting script to verify no test specification APIs are imported within production modules.
npm run lint
```

**Accept when:**
- All unit test suites execute and pass with zero failures.
- Static verification reports zero occurrences of test framework constructs within runtime CLI modules.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated CI, static analysis checks, and peer code review.
</enforcement>