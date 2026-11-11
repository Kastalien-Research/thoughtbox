---
version: 2
name: cross-cutting-icon-dimensions-presentation-colors-cont-b1fd
description: "Lucide React Iconography Adoption: Icon Dimensions Presentation Colors Controlled Through"
metadata:
  actual:
    adr_id: b1fd2442-f6eb-4438-b81f-be7dad98abb4
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

# Lucide React Iconography Adoption: Icon Dimensions Presentation Colors Controlled Through

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LUCIDE-001** SHOULD: Icon dimensions and presentation colors SHOULD be controlled through utility styling classes applied directly to the icon component properties.

### Verify

```bash
# Discover and execute the repository static analysis script across all presentation components
# Discover and run the project type checker
# Discover and execute the component test suite
```

**Accept when:**
- Static analysis and type verification pass without unresolved icon module imports or property errors.
- All decorative icon component instances declare appropriate accessibility attributes or accessible text fallbacks.
- No unauthorized secondary icon libraries or redundant raw SVG glyph definitions are introduced into application components.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>