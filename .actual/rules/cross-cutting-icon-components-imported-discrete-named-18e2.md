---
version: 2
name: cross-cutting-icon-components-imported-discrete-named-18e2
description: "Lucide React Iconography Adoption: Icon Components Imported Discrete Named Imports"
metadata:
  actual:
    adr_id: 18e24a65-3b77-4ae3-bb33-062ad14420fc
    status: accepted
    candidate_group_id: 5eabd316-ca20-415c-8e0e-ba9fa6a57805
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/components/session-area/**
---

# Lucide React Iconography Adoption: Icon Components Imported Discrete Named Imports

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`.

These rules are ALWAYS ACTIVE for user interface visual indicators, status glyphs, and decorative icons rendered within application pages, client presentation components, interactive buttons, and disclosure elements incorporating visual icon elements.

### Rules

- **R-ICON-001** MUST: Icon components MUST be imported using discrete named imports from the library to preserve bundler tree-shaking capabilities and avoid importing unused icon definitions.

### Verify

```bash
# Discover and execute the project static analysis script across all presentation components
npm run lint
# Discover and run the project type checker
npm run typecheck
# Discover and execute the component test suite
npm run test
```

**Accept when:**
- Static analysis and type verification pass without unresolved icon module imports or property errors.
- All decorative icon component instances declare appropriate accessibility attributes or accessible text fallbacks.
- No unauthorized secondary icon libraries or redundant raw SVG glyph definitions are introduced into application components.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration checks and peer code reviews.
</enforcement>