---
version: 2
name: cross-cutting-before-implementing-updating-visual-icon-d464
description: "Lucide React Iconography Adoption: Before Implementing Updating Visual Icon References"
metadata:
  actual:
    adr_id: d46465b1-31a9-495b-bd6d-71ea0380097d
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

# Lucide React Iconography Adoption: Before Implementing Updating Visual Icon References

Scope: applies to `apps/web/src/app/**`, `apps/web/src/components/session-area/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-LUCIDE-001** MUST: Before implementing or updating visual icon references, the consumer MUST inspect the repository lock artifact to determine the exact resolved version of the iconography library and ensure imported icon identifiers exist within that resolved release.
- **R-LUCIDE-002** MUST: Import icon components using individual named imports from the root package to ensure unused icons are eliminated during bundle optimization.
- **R-LUCIDE-003** MUST: Apply dimensional and coloration utility classes directly to the icon components to enable flexible scaling and contextual theme color inheritance.

### Verify

```bash
# Discover and execute the repository static analysis script across all presentation components
# Discover and run the project type checker to ensure all referenced icon components match resolved library types
# Discover and execute the component test suite to confirm icon rendering and accessibility attribute presence
```

**Accept when:**
- Static analysis and type verification pass without unresolved icon module imports or property errors.
- All decorative icon component instances declare appropriate accessibility attributes or accessible text fallbacks.
- No unauthorized secondary icon libraries or redundant raw SVG glyph definitions are introduced into application components.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks execute static analysis and type checking across all pull requests.
</enforcement>