---
version: 2
name: cross-cutting-test-configuration-modules-not-load-11b3
description: "Adoption of vitest/config for Unit Testing Configuration: Test Configuration Modules Not Load Alternative"
metadata:
  actual:
    adr_id: 11b35fb3-b8b3-4e7b-913a-70ac31076d5a
    status: accepted
    candidate_group_id: 0bd669a3-2978-4669-9c27-9d82b742b3e2
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of vitest/config for Unit Testing Configuration: Test Configuration Modules Not Load Alternative

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VTC-001** MUST_NOT: Test configuration modules MUST NOT load alternative unit testing configuration schemas or conflicting test harness runners within the application workspace.

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