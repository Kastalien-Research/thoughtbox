---
version: 2
name: cross-cutting-standalone-execution-scripts-that-depend-6ed4
description: "Adoption of dotenv for Script Runtime Environment Configuration: Standalone Execution Scripts That Depend External"
metadata:
  actual:
    adr_id: 6ed4b68a-4526-490e-90c8-ec53f11540e2
    status: accepted
    candidate_group_id: 4e4e5342-49b8-44a6-a6de-c337a61417e3
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of dotenv for Script Runtime Environment Configuration: Standalone Execution Scripts That Depend External

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for standalone automation scripts, test harnesses, evaluation runners, and probe monitors executing outside containerized application servers, and utility entry points that initialize external service clients requiring API keys, endpoints, or environment-specific runtime configurations.

### Rules

- **R-DOTENV-001** MUST: Standalone execution scripts that depend on external service configuration or credentials MUST adopt the dotenv library as the standard runtime mechanism for populating the process environment.
- **R-DOTENV-002** MANDATORY: Ensure configuration initialization occurs synchronously at script entry points before initializing external client instances or accessing process environment values.
- **R-DOTENV-003** MANDATORY: Implement clear error logging with remediation instructions when required environment variables are absent upon initialization.
- **R-DOTENV-004** MANDATORY: Discover the dependency manifest in the repo to identify the build tool and inspect the repository lock or resolution artifact to determine the exact resolved version before using versioned libraries.

### Verify

```bash
# Discover and run the project static analysis and linting checks declared in the repository build manifest
# Discover and execute script verification test suites from the project manifest
```

**Accept when:**
- All script entry points initialize environment configuration using the adopted library prior to reading process environment variables.
- Repository verification test suites and static analysis checks pass without configuration loading errors or missing credential diagnostics.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks executing repository test suites and static analysis linters, and by peer code review verifying early initialization and absence of hardcoded secrets.
</enforcement>