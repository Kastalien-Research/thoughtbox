---
version: 2
name: cross-cutting-configuration-parameters-passed-defineco-a0a9
description: "Adoption of vitest/config for Unit Testing Configuration: Configuration Parameters Passed Defineconfig Remain Strictly"
metadata:
  actual:
    adr_id: a0a99a02-4dc7-4327-8757-eda5047f35f7
    status: accepted
    candidate_group_id: 0bd669a3-2978-4669-9c27-9d82b742b3e2
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of vitest/config for Unit Testing Configuration: Configuration Parameters Passed Defineconfig Remain Strictly

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VIT-001** SHOULD: Configuration parameters passed to defineConfig SHOULD remain strictly typed and limited to unit testing concerns.

### Verify

```bash
# Discover the unit test script declared in the project dependency manifest and execute it via the workspace runner
# Verify that the test configuration imports defineConfig from the appropriate test runner config module and parses without schema errors
```

**Accept when:**
- The project unit test suite executes successfully with zero failures
- The test configuration passes validation during test runner initialization without errors or deprecation warnings

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>