---
version: 2
name: cross-cutting-path-resolution-test-directories-module-7613
description: "Adoption of vitest/config for Unit Testing Configuration: Path Resolution Test Directories Module Mappings"
metadata:
  actual:
    adr_id: 76136cbd-606f-4a95-ac78-f4b5b67e4e33
    status: accepted
    candidate_group_id: 0bd669a3-2978-4669-9c27-9d82b742b3e2
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of vitest/config for Unit Testing Configuration: Path Resolution Test Directories Module Mappings

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TEST-001** SHOULD: Path resolution for test directories and module mappings within the test configuration SHOULD utilize the standard path module.

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