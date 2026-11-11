---
version: 2
name: cross-cutting-scripts-not-hardcode-secrets-authenticat-b398
description: "Adoption of dotenv for Script Runtime Environment Configuration: Scripts Not Hardcode Secrets Authentication Keys"
metadata:
  actual:
    adr_id: b398051c-edb1-45fe-b023-fe2411735fa1
    status: accepted
    candidate_group_id: 4e4e5342-49b8-44a6-a6de-c337a61417e3
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of dotenv for Script Runtime Environment Configuration: Scripts Not Hardcode Secrets Authentication Keys

Scope: applies to `scripts/**`.

These rules are ALWAYS ACTIVE for standalone automation scripts, test harnesses, evaluation runners, and probe monitors executing outside containerized application servers.

### Rules

- **R-ENV-001** MUST_NOT: Scripts MUST NOT hardcode secrets, authentication keys, or external service endpoints into source code files.

### Verify

```bash
# Discover and run the project static analysis and linting checks declared in the repository build manifest
# Discover and execute script verification test suites from the project manifest
```

**Accept when:**
- All script entry points initialize environment configuration using the adopted library prior to reading process environment variables.
- Repository verification test suites and static analysis checks pass without configuration loading errors or missing credential diagnostics.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks executing repository test suites and static analysis linters, as well as peer code reviews.
</enforcement>