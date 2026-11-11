---
version: 2
name: cross-cutting-test-suites-not-declare-hoc-75f5
description: "Adoption of vitest/config defineConfig for Unit Test Configuration: Test Suites Not Declare Hoc Isolated"
metadata:
  actual:
    adr_id: 75f519b2-0847-41af-921b-db75c3570802
    status: accepted
    candidate_group_id: 25d23f8c-14ac-45ec-9e97-bcfbb4939453
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - "**"
      - "!apps/web/**"
      - "!infra/gcp/**"
      - "!plugins/thoughtbox-claude-code/**"
      - "!supabase/**"
---

# Adoption of vitest/config defineConfig for Unit Test Configuration: Test Suites Not Declare Hoc Isolated

Scope: applies to the whole repository; excludes `!apps/web/**`, `!infra/gcp/**`, `!plugins/thoughtbox-claude-code/**`, `!supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VITEST-001** MUST_NOT: Test suites MUST_NOT declare ad-hoc, isolated execution harnesses that bypass the centralized configuration defined with vitest/config.

### Verify

```bash
grep -rn "from 'vitest/config'" .
grep -rn "defineConfig" .
```

**Accept when:**
- The test configuration module imports and utilizes defineConfig from vitest/config.
- The project test suite executes successfully using the configured test definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>