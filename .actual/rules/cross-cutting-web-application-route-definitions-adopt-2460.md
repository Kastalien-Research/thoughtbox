---
version: 2
name: cross-cutting-web-application-route-definitions-adopt-2460
description: "Next.js Core Framework Adoption: Web Application Route Definitions Adopt Next"
metadata:
  actual:
    adr_id: 24607cdf-3f5e-4563-85cb-eeb7efcd10ed
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

# Next.js Core Framework Adoption: Web Application Route Definitions Adopt Next

Scope: applies to `apps/web/next.config.ts`, `apps/web/src/app/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-NXT-001** MUST: Web application route definitions MUST adopt Next.js as the core application framework for page routing and view composition.

### Verify

```bash
# Discover and execute project compilation and type-checking scripts from the repository manifest
# Example discovery pattern:
PM=$(npm run --silent 2>/dev/null && echo "npm" || echo "yarn")
# Run type checking and build
$PM run typecheck || npx tsc --noEmit
$PM run build
```

**Accept when:**
- The project build script executes successfully with zero compilation errors across all route modules.
- Static type verification passes without errors for all framework routing and navigation imports.
- The resolved dependency version matches the authoritative lock artifact in the repository.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>