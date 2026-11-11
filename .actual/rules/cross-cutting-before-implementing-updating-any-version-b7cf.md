---
version: 2
name: cross-cutting-before-implementing-updating-any-version-b7cf
description: "Unit Test Specification Structure via describe Function: Before Implementing Updating Any Versioned Testing"
metadata:
  actual:
    adr_id: b7cfc67a-3d02-4fca-9531-adbf15501cae
    status: accepted
    candidate_group_id: 2a495342-30ff-49b3-add7-50c8832870f9
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Unit Test Specification Structure via describe Function: Before Implementing Updating Any Versioned Testing

Scope: applies to `plugins/thoughtbox-claude-code/src/cli/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-UT-001** MUST: Before implementing or updating any versioned testing framework dependency, developers MUST inspect the repository lock artifact to determine the exact resolved dependency version and validate API compatibility.
- **R-UT-002** MUST: Ensure test suite definitions utilizing describe functions reside strictly within repository paths targeted by the project test discovery configuration.
- **R-UT-003** MUST: Validate that runtime error formatting in CLI modules uses standard error handling constructs rather than test specification blocks.

### Verify

```bash
# Discover the project test execution script from repository metadata and run all unit test suites.
# Execute the repository static analysis and linting script to verify no test specification APIs are imported within production modules.
```

**Accept when:**
- All unit test suites execute and pass with zero failures.
- Static verification reports zero occurrences of test framework constructs within runtime CLI modules.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>