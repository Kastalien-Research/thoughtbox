---
version: 2
name: cross-cutting-prior-implementing-updating-configuratio-7158
description: "Adoption of dotenv for Script Runtime Environment Configuration: Prior Implementing Updating Configuration Loading Code"
metadata:
  actual:
    adr_id: 71584c37-1941-4b3c-b547-c20c5017c8ee
    status: accepted
    candidate_group_id: 4e4e5342-49b8-44a6-a6de-c337a61417e3
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of dotenv for Script Runtime Environment Configuration: Prior Implementing Updating Configuration Loading Code

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for all standalone automation scripts, test harnesses, evaluation runners, and probe monitors executing outside containerized application servers, and utility entry points that initialize external service clients.

### Rules

- **R-DOTENV-001** MUST: Prior to implementing or updating configuration loading code, the consumer MUST inspect the repository dependency manifest and authoritative lock artifact to resolve the exact locked version of the adopted library.
- **R-DOTENV-002** MUST: Ensure configuration initialization occurs synchronously at script entry points before initializing external client instances or accessing process environment values.
- **R-DOTENV-003** MUST: Implement clear error logging with remediation instructions when required environment variables are absent upon initialization.

### Verify

```bash
# Discover and run the project static analysis and linting checks declared in the repository build manifest
# Discover and execute script verification test suites from the project manifest
```

**Accept when:**
- All script entry points initialize environment configuration using the adopted library prior to reading process environment variables.
- Repository verification test suites and static analysis checks pass without configuration loading errors or missing credential diagnostics.

<enforcement>
Claude Code MUST NOT skip or defer verification. Automated continuous integration checks and peer code reviews verify early initialization and absence of hardcoded secrets.
</enforcement>