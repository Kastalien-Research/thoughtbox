---
version: 2
name: cross-cutting-decorative-icons-rendered-alongside-desc-dea0
description: "Lucide React Iconography Adoption: Decorative Icons Rendered Alongside Descriptive Textual"
metadata:
  actual:
    adr_id: dea022df-9237-4463-a8a0-aea684f16ef1
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

# Lucide React Iconography Adoption: Decorative Icons Rendered Alongside Descriptive Textual

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LUCIDE-001** MUST: Decorative icons rendered alongside descriptive textual labels MUST declare the aria-hidden attribute set to true to ensure proper screen reader accessibility.

### Verify

```bash
# Discover and execute the project static analysis script across presentation components
# Discover and run the project type checker to verify icon component types
# Discover and execute the component test suite to confirm icon rendering and accessibility attributes
```

**Accept when:**
- Static analysis and type verification pass without unresolved icon module imports or property errors.
- All decorative icon component instances declare appropriate accessibility attributes or accessible text fallbacks.
- No unauthorized secondary icon libraries or redundant raw SVG glyph definitions are introduced into application components.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated CI checks enforce static analysis, type checking, and peer code reviews.
</enforcement>