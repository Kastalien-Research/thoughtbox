---
version: 2
name: cross-cutting-unit-test-suites-within-application-3669
description: "Adoption of vitest/config for Unit Testing Configuration: Unit Test Suites Within Application Workspace"
metadata:
  actual:
    adr_id: 36695edb-647f-458a-8a6f-1acc87a68b94
    status: accepted
    candidate_group_id: 0bd669a3-2978-4669-9c27-9d82b742b3e2
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of vitest/config for Unit Testing Configuration: Unit Test Suites Within Application Workspace

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VITEST-001** MUST: Unit test suites within the application workspace MUST define their test execution environment and runner settings using defineConfig imported from vitest/config.

### Verify

```bash
# Discover the unit test script declared in the project dependency manifest and execute it via the workspace runner
# Verify that the test configuration imports defineConfig from vitest/config and parses without schema errors
```

**Accept when:**
- The project unit test suite executes successfully with zero failures
- The test configuration passes validation during test runner initialization without errors or deprecation warnings

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>