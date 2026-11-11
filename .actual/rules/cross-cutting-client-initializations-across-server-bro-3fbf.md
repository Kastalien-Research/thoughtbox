---
version: 2
name: cross-cutting-client-initializations-across-server-bro-3fbf
description: "Adoption of @supabase/ssr for Server and Client Runtime Isolation: Client Initializations Across Server Browser Runtimes"
metadata:
  actual:
    adr_id: 3fbffcef-ecc7-4041-9f8a-c81c947c0f4d
    status: accepted
    candidate_group_id: 4d420b84-149f-4fd3-8aa4-5241d34ed725
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Server and Client Runtime Isolation: Client Initializations Across Server Browser Runtimes

Scope: applies to `apps/web/src/lib/supabase/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-SUP-001** MUST: All client initializations across server and browser runtimes MUST bind generated database type definitions to ensure end-to-end schema typing.

### Verify

```bash
# Discover the project verification script from the root manifest and execute tests, type checker, and linter
# Example discovery steps depending on package manager:
npm test || yarn test || pnpm test
npm run typecheck || yarn typecheck || pnpm typecheck
npm run lint || yarn lint || pnpm lint
```

**Accept when:**
- Client instantiation tests execute without errors across both server and browser test environments.
- Type checking passes with zero compiler errors across all modules importing the client factories.
- Lint checks confirm no boundary crossing between server header modules and client-side entry points.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by continuous integration type checking, static analysis workflows, and peer code review.
</enforcement>