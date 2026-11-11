---
version: 2
name: cross-cutting-merge-execution-components-tool-handlers-2dc1
description: "Evidence Generator Module Adoption: Merge Execution Components Tool Handlers Not"
metadata:
  actual:
    adr_id: 2dc1b7c9-a8c2-4136-8770-5e0c0705a684
    status: accepted
    candidate_group_id: 032c6665-47d9-40fe-972a-7085ddf511ec
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge/**
---

# Evidence Generator Module Adoption: Merge Execution Components Tool Handlers Not

Scope: applies to `src/merge/**`.

These rules are ALWAYS ACTIVE for all merge workflow handlers, merge tool handlers, and merge coordination modules requiring audit or evidence artifact generation.

### Rules

- **R-MERGE-001** MUST_NOT: Merge execution components and tool handlers MUST NOT construct, format, or serialize evidence artifacts inline within workflow dispatch logic.

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
Claude Code MUST NOT skip or defer verification. Verification is mandatory via continuous integration test suites, static type analysis, module boundary linting, and peer review.
</enforcement>