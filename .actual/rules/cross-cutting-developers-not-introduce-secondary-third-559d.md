---
version: 2
name: cross-cutting-developers-not-introduce-secondary-third-559d
description: "Lucide React Iconography Adoption: Developers Not Introduce Secondary Third Party"
metadata:
  actual:
    adr_id: 559dce76-107f-4c7b-aace-b2f10e3f1f4c
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

# Lucide React Iconography Adoption: Developers Not Introduce Secondary Third Party

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`.

These rules are ALWAYS ACTIVE for all UI surface files, presentation components, status glyphs, and interactive elements across workspace dashboards, public pages, and session diagnostic tools.

### Rules

- **R-LUCIDE-001** MUST_NOT: Developers MUST NOT introduce secondary third-party icon libraries or inline raw SVG vector markup for iconography available within the adopted library.
- **R-LUCIDE-002** MANDATORY: The consumer MUST derive build tools, package managers, and version numbers from the project repository following the LOCK-VERSION GROUNDING process.
- **R-LUCIDE-003** MUST: Import icon components using individual named imports from the root package to ensure unused icons are eliminated during bundle optimization.
- **R-LUCIDE-004** MUST: Apply dimensional and coloration utility classes directly to the icon components to enable flexible scaling and contextual theme color inheritance.

### Verify

```bash
# Discover and execute the repository static analysis script across all presentation components
# Discover and run the project type checker to verify named icon imports and property types
# Discover and execute the component test suite to confirm icon rendering and accessibility attributes
```

**Accept when:**
- Static analysis and type verification pass without unresolved icon module imports or property errors.
- All decorative icon component instances declare appropriate accessibility attributes or accessible text fallbacks.
- No unauthorized secondary icon libraries or redundant raw SVG glyph definitions are introduced into application components.

<enforcement>
Claude Code MUST NOT skip or defer verification. All pull requests must pass automated static analysis, type checking, and component tests ensuring compliance with iconography selection, sizing conventions, and accessibility declarations.
</enforcement>