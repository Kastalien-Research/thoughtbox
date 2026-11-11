---
version: 2
name: cross-cutting-consumers-inspect-repository-lock-resolu-ff3a
description: "Adoption of vitest/config for Unit Testing Configuration: Consumers Inspect Repository Lock Resolution Artifact"
metadata:
  actual:
    adr_id: ff3af91e-0910-4589-b2fc-60bc26f19195
    status: accepted
    candidate_group_id: 0bd669a3-2978-4669-9c27-9d82b742b3e2
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of vitest/config for Unit Testing Configuration: Consumers Inspect Repository Lock Resolution Artifact

Scope: applies to `apps/web/**`.

These rules are ALWAYS ACTIVE for unit test runner configuration, environment definitions, and module path resolution and alias mapping within the web application workspace.

### Rules

- **R-VIT-001** MUST: Consumers MUST inspect the repository lock or resolution artifact to determine the exact resolved version of vitest/config before authoring or modifying test configurations, verifying all configuration options against version-specific documentation.

### Verify

```bash
# Discover the unit test script declared in the project dependency manifest and execute it via the workspace runner
# Verify that the test configuration imports defineConfig from vitest/config and parses without schema errors
```

**Accept when:**
- The project unit test suite executes successfully with zero failures
- The test configuration passes validation during test runner initialization without errors or deprecation warnings

<enforcement>
Claude Code MUST NOT skip or defer verification. All test configurations must use defineConfig from vitest/config and be backed by lockfile version inspection.
</enforcement>