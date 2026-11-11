---
version: 2
name: cross-cutting-test-suite-configuration-structured-defi-011d
description: "Adoption of vitest/config defineConfig for Unit Test Configuration: Test Suite Configuration Structured Defineconfig Vitest"
metadata:
  actual:
    adr_id: 011d702e-892b-4cca-9346-f7261474cb17
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

# Adoption of vitest/config defineConfig for Unit Test Configuration: Test Suite Configuration Structured Defineconfig Vitest

Scope: applies to the whole repository; excludes `!apps/web/**`, `!infra/gcp/**`, `!plugins/thoughtbox-claude-code/**`, `!supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VITEST-001** MUST: The test suite configuration MUST be structured using defineConfig from vitest/config to declare unit testing options and execution environments.

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