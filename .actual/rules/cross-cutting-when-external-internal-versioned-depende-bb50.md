---
version: 2
name: cross-cutting-when-external-internal-versioned-depende-bb50
description: "Evidence Generator Module Adoption: When External Internal Versioned Dependencies Are"
metadata:
  actual:
    adr_id: bb506f15-cffe-4330-8a07-efef370368cc
    status: accepted
    candidate_group_id: 032c6665-47d9-40fe-972a-7085ddf511ec
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge/**
---

# Evidence Generator Module Adoption: When External Internal Versioned Dependencies Are

Scope: applies to `src/merge/**`.

These rules are ALWAYS ACTIVE for all merge workflow handlers, merge tool handlers, and merge coordination modules requiring audit or evidence artifact generation.

### Rules

- **R-EVM-001** MUST: When external or internal versioned dependencies are introduced to support evidence generation, developers MUST inspect repository lock artifacts to verify resolved versions prior to integration.

### Verify

```bash
# Discover and execute the project test suite covering merge handlers and evidence generation
# Discover and execute the repository static analysis and type checking suite
# Discover and execute the repository module boundary linting or dependency validation checks
```

**Accept when:**
- All merge handler and tool handler test suites pass with evidence generated via the shared evidence module.
- Static type checking confirms all evidence records adhere to domain type definitions without type assertions.
- Code analysis verifies no direct evidence formatting or synthesis occurs outside the evidence module.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration automated test suites, static type analysis, and module boundary linting enforce these rules.
</enforcement>