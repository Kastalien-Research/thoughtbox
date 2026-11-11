---
version: 2
name: cross-cutting-infrastructure-configurations-define-mul-9334
description: "Google Cloud Provider Adoption for Runtime Deployment Target: Infrastructure Configurations Define Multiple Provider Aliases"
metadata:
  actual:
    adr_id: 93346a42-7936-4f17-bd12-4e354932d2df
    status: accepted
    candidate_group_id: b6937f1b-8b59-41c1-af4b-6d3c76339a0b
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# Google Cloud Provider Adoption for Runtime Deployment Target: Infrastructure Configurations Define Multiple Provider Aliases

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for infrastructure modules declaring cloud execution targets, hosting environments, and declarative provider definitions managing cloud runtime resources.

### Rules

- **R-GCP-001** MAY: Infrastructure configurations MAY define multiple provider aliases for the Google provider when multi-region or cross-project resource orchestration is explicitly required.

### Verify

```bash
# Discover and execute the repository infrastructure formatting and syntax validation script against all provider definition files.
# Discover and run the infrastructure plan validation command to ensure provider configuration resolves valid project and regional parameters without error.
```

**Accept when:**
- Infrastructure validation commands return exit code zero with no syntax or semantic errors.
- Provider configuration successfully initializes with the exact locked provider version and binds to the resolved environment variables.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated continuous integration checks and mandatory peer review by platform engineers.
</enforcement>