---
version: 2
name: cross-cutting-test-execution-parameters-coverage-setti-8626
description: "Adoption of vitest/config defineConfig for Unit Test Configuration: Test Execution Parameters Coverage Settings Runner"
metadata:
  actual:
    adr_id: 86265632-f91e-4afc-b94d-90f3553c3a91
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

# Adoption of vitest/config defineConfig for Unit Test Configuration: Test Execution Parameters Coverage Settings Runner

Scope: applies to the whole repository; excludes `!apps/web/**`, `!infra/gcp/**`, `!plugins/thoughtbox-claude-code/**`, `!supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-TEST-001** SHOULD: Test execution parameters, coverage settings, and runner lifecycle options SHOULD be centralized within the configuration definition governed by vitest/config.
- **R-TEST-002** MANDATORY: The consumer MUST derive all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-TEST-003** MANDATORY: Before writing code that uses a versioned library, execute the LOCK-VERSION GROUNDING sequence (find manifest, identify build tool, inspect lock/resolution artifact, look up official version-specific documentation, confirm API existence, re-run per dependency at point of use).
- **R-TEST-004** MANDATORY: Ensure all test configuration exports utilize defineConfig from vitest/config to maintain typed configuration contracts across the project.

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