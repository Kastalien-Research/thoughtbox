---
version: 2
name: cross-cutting-route-components-isolate-parameter-extra-c911
description: "Adoption of Next.js Navigation Module for Application Route Handling: Route Components Isolate Parameter Extraction Navigation"
metadata:
  actual:
    adr_id: c911dcbe-73b3-4355-88d4-fd437fbabc3b
    status: accepted
    candidate_group_id: 773a65a9-728b-45f5-9e58-712632fa746d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of Next.js Navigation Module for Application Route Handling: Route Components Isolate Parameter Extraction Navigation

Scope: applies to `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for application route entrypoints, interactive components requiring programmatic navigation or route parameter access, and shared presentation and explorer components deployed across authenticated and public route trees.

### Rules

- **R-NAV-001** SHOULD: Route components SHOULD isolate parameter extraction and navigation logic at the route entrypoint level and pass resolved data or domain handlers down to presentational components.
- **R-NAV-002** MANDATORY: The consumer MUST derive all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-NAV-003** MANDATORY: Before writing code that uses a versioned library, execute in order: (1) Find dependency manifest, (2) Identify build tool, (3) Inspect repository lock/resolution artifact for exact resolved version, (4) Look up official documentation/changelog for that exact version without relying solely on training data, (5) Confirm every API/class/function exists in that exact version's documentation, (6) Re-run steps 3-5 per dependency at point of use for version-sensitive behavior.

### Verify

```bash
# Discover the project build configuration and run type verification
# Discover and run repository linter to verify routing import boundaries
```

**Accept when:**
- Static type verification passes without errors across all route entrypoints importing navigation primitives.
- Linter rules confirm that internal routing references use framework navigation rather than direct window location modifications.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification via automated continuous integration checks executing repository type verification and linting is mandatory.
</enforcement>