---
version: 2
name: cross-cutting-application-adopt-lucide-react-standard-4494
description: "Lucide React Iconography Adoption: Application Adopt Lucide React Standard Iconography"
metadata:
  actual:
    adr_id: 449455b9-9891-4e84-a5b8-331cc63f395f
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

# Lucide React Iconography Adoption: Application Adopt Lucide React Standard Iconography

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LUC-001** MUST: The application MUST adopt Lucide React as the standard iconography library for all user interface visual indicators and glyphs across client and server rendering surfaces.

### Verify

```bash
# Discover the repository static analysis script and execute it across all presentation components
# Discover and run the project type checker
# Discover and execute the component test suite
```

**Accept when:**
- Static analysis and type verification pass without unresolved icon module imports or property errors.
- All decorative icon component instances declare appropriate accessibility attributes or accessible text fallbacks.
- No unauthorized secondary icon libraries or redundant raw SVG glyph definitions are introduced into application components.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks and peer code reviews enforce compliance.
</enforcement>