---
version: 2
name: cross-cutting-test-configurations-provide-configuratio-3131
description: "Adoption of vitest/config defineConfig for Unit Test Configuration: Test Configurations Provide Configuration Objects Through"
metadata:
  actual:
    adr_id: 313117fb-fdc3-4715-bc38-642214692786
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

# Adoption of vitest/config defineConfig for Unit Test Configuration: Test Configurations Provide Configuration Objects Through

Scope: applies to the whole repository; excludes `!apps/web/**`, `!infra/gcp/**`, `!plugins/thoughtbox-claude-code/**`, `!supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VITEST-001** MUST: Test configurations MUST provide configuration objects through the defineConfig function helper rather than exporting unvalidated raw configuration objects.

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