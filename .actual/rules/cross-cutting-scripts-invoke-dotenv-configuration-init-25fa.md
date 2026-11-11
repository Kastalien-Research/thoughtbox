---
version: 2
name: cross-cutting-scripts-invoke-dotenv-configuration-init-25fa
description: "Adoption of dotenv for Script Runtime Environment Configuration: Scripts Invoke Dotenv Configuration Initializer Earliest"
metadata:
  actual:
    adr_id: 25fa4f44-5529-4a31-9601-cc2b7551d918
    status: accepted
    candidate_group_id: 4e4e5342-49b8-44a6-a6de-c337a61417e3
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of dotenv for Script Runtime Environment Configuration: Scripts Invoke Dotenv Configuration Initializer Earliest

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for standalone automation scripts, test harnesses, evaluation runners, and probe monitors executing outside containerized application servers, and utility entry points that initialize external service clients.

### Rules

- **R-ENV-001** MUST: Scripts MUST invoke the dotenv configuration initializer at the earliest entry point before any downstream module or client library accesses process environment variables.

### Verify

```bash
# Discover and run the project static analysis and linting checks declared in the repository build manifest
# Discover and execute script verification test suites from the project manifest to confirm configuration loading behavior across probe and evaluation scripts
```

**Accept when:**
- All script entry points initialize environment configuration using the adopted library prior to reading process environment variables.
- Repository verification test suites and static analysis checks pass without configuration loading errors or missing credential diagnostics.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory.
</enforcement>