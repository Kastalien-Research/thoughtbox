---
version: 2
name: cross-cutting-merge-handling-tool-coordination-workflo-b6a4
description: "Evidence Generator Module Adoption: Merge Handling Tool Coordination Workflows Delegate"
metadata:
  actual:
    adr_id: b6a4b4fc-29bc-4cf8-9ac4-6a7399d5bec2
    status: accepted
    candidate_group_id: 032c6665-47d9-40fe-972a-7085ddf511ec
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge/**
---

# Evidence Generator Module Adoption: Merge Handling Tool Coordination Workflows Delegate

Scope: applies to `src/merge/**`.

These rules are ALWAYS ACTIVE for all merge workflow handlers, merge tool handlers, and merge coordination modules requiring audit or evidence artifact generation.

### Rules

- **R-MERGE-001** MUST: All merge handling and merge tool coordination workflows MUST delegate evidence creation and provenance recording to the shared evidence-generator module.

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
Claude Code MUST NOT skip or defer verification. Verification via automated test suites, static type analysis, and module boundary linting is mandatory.
</enforcement>