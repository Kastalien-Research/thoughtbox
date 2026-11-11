---
version: 2
name: cross-cutting-infrastructure-configurations-not-hardco-9be7
description: "Google Cloud Provider Adoption for Runtime Deployment Target: Infrastructure Configurations Not Hardcode Cloud Project"
metadata:
  actual:
    adr_id: 9be7462a-6950-485a-8263-fdaf8f3420fe
    status: accepted
    candidate_group_id: b6937f1b-8b59-41c1-af4b-6d3c76339a0b
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# Google Cloud Provider Adoption for Runtime Deployment Target: Infrastructure Configurations Not Hardcode Cloud Project

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-GCP-001** MUST_NOT: Infrastructure configurations MUST_NOT hardcode cloud project identifiers or deployment regions directly within provider declarations, requiring dynamic derivation from external configuration variables instead.

### Verify

```bash
# Discover and execute the repository infrastructure formatting and syntax validation script against all provider definition files.
# Discover and run the infrastructure plan validation command to ensure provider configuration resolves valid project and regional parameters without error.
```

**Accept when:**
- Infrastructure validation commands return exit code zero with no syntax or semantic errors.
- Provider configuration successfully initializes with the exact locked provider version and binds to the resolved environment variables.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks and mandatory peer review.
</enforcement>