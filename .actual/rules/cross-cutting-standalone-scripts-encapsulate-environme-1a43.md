---
version: 2
name: cross-cutting-standalone-scripts-encapsulate-environme-1a43
description: "Adoption of dotenv for Script Runtime Environment Configuration: Standalone Scripts Encapsulate Environment Variable Retrieval"
metadata:
  actual:
    adr_id: 1a433fb7-03be-4f17-8807-94459b76bb6f
    status: accepted
    candidate_group_id: 4e4e5342-49b8-44a6-a6de-c337a61417e3
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of dotenv for Script Runtime Environment Configuration: Standalone Scripts Encapsulate Environment Variable Retrieval

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for standalone automation scripts, test harnesses, evaluation runners, and probe monitors executing outside containerized application servers, and utility entry points that initialize external service clients.

### Rules

- **R-ENV-001** SHOULD: Standalone scripts encapsulate environment variable retrieval within dedicated configuration accessors rather than referencing raw process environment variables across distributed functional logic.

### Verify

```bash
# Discover and run project static analysis, linting checks, and script verification test suites from the repository build manifest
```

**Accept when:**
- All script entry points initialize environment configuration using the adopted library prior to reading process environment variables.
- Repository verification test suites and static analysis checks pass without configuration loading errors or missing credential diagnostics.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>