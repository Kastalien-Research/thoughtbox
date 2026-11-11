---
version: 2
name: cross-cutting-before-implementing-modifying-code-that-9f61
description: "Next.js Core Framework Adoption: Before Implementing Modifying Code That Depends"
metadata:
  actual:
    adr_id: 9f616d17-1af8-4cbe-9cf7-8da10d8f44af
    status: accepted
    candidate_group_id: a455d5e5-139d-42ba-a628-cdc1136a84b0
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - next.config.ts
      - src/app/**
---

# Next.js Core Framework Adoption: Before Implementing Modifying Code That Depends

Scope: applies to `apps/web/next.config.ts`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all page components, route definitions, navigation, and link orchestration logic across public and authenticated application areas of the web application service.

### Rules

- **R-FRAMEWORK-001** MUST: Before implementing or modifying code that depends on the framework, developers MUST inspect the repository lock resolution artifact to identify the exact resolved version and verify API compatibility against official version documentation.

### Verify

```bash
# Discover and execute the project compilation script from the repository manifest
# Discover and execute the repository type-checking script
# Example derivation based on typical Node.js/Next.js projects:
if [ -f "pnpm-lock.yaml" ]; then
  pnpm run build
  pnpm run typecheck
elif [ -f "yarn.lock" ]; then
  yarn build
  yarn typecheck
else
  npm run build
  npm run typecheck
fi
```

**Accept when:**
- The project build script executes successfully with zero compilation errors across all route modules.
- Static type verification passes without errors for all framework routing and navigation imports.
- The resolved dependency version matches the authoritative lock artifact in the repository.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration pipeline and mandatory peer code review.
</enforcement>