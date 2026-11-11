---
version: 2
name: cross-cutting-engineers-discover-project-dependency-lo-81b4
description: "Adoption of vitest/config defineConfig for Unit Test Configuration: Engineers Discover Project Dependency Lock Artifact"
metadata:
  actual:
    adr_id: 81b4a3ed-b95f-4d7a-8177-cbf3010aa911
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

# Adoption of vitest/config defineConfig for Unit Test Configuration: Engineers Discover Project Dependency Lock Artifact

Scope: applies to the whole repository; excludes `!apps/web/**`, `!infra/gcp/**`, `!plugins/thoughtbox-claude-code/**`, `!supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-VIT-001** MUST: Engineers MUST discover the project dependency lock artifact and resolve the exact locked version of vitest/config before authoring or modifying test suite configurations.
- **R-VIT-002** MUST: Ensure all test configuration exports utilize defineConfig from vitest/config to maintain typed configuration contracts across the project.

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