---
version: 2
name: cross-cutting-scripts-validate-presence-format-require-9900
description: "Adoption of dotenv for Script Runtime Environment Configuration: Scripts Validate Presence Format Required Environment"
metadata:
  actual:
    adr_id: 9900af2f-fd4d-4c7a-9269-8a369928b08a
    status: accepted
    candidate_group_id: 4e4e5342-49b8-44a6-a6de-c337a61417e3
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of dotenv for Script Runtime Environment Configuration: Scripts Validate Presence Format Required Environment

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for standalone automation scripts, test harnesses, evaluation runners, and probe monitors executing outside containerized application servers, and utility entry points that initialize external service clients.

### Rules

- **R-ENV-001** MUST: Scripts MUST validate the presence and format of required environment variables immediately following configuration initialization and fail fast with informative diagnostic messages when critical parameters are missing.
- **R-ENV-002** MUST: Ensure configuration initialization occurs synchronously at script entry points before initializing external client instances or accessing process environment values.
- **R-ENV-003** MUST: Implement clear error logging with remediation instructions when required environment variables are absent upon initialization.
- **R-ENV-004** MANDATORY (DISCOVERY POLICY): The consumer MUST discover all tool names, file names, commands, package managers, and version numbers from the project repository.
- **R-ENV-005** MANDATORY (LOCK-VERSION GROUNDING): Before writing code that uses a versioned library, execute in order: find dependency manifest, identify build tool, inspect repository lock or resolution artifact for exact version, look up official documentation for that exact version, confirm every API/class/function exists in that version's documentation, and re-run steps per dependency at point of use.

### Verify

```bash
# Discover and run the project static analysis and linting checks declared in the repository build manifest
# Discover and execute script verification test suites from the project manifest
```

**Accept when:**
- All script entry points initialize environment configuration using the adopted library prior to reading process environment variables.
- Repository verification test suites and static analysis checks pass without configuration loading errors or missing credential diagnostics.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>