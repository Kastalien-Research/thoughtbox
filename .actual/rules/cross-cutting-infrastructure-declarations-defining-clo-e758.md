---
version: 2
name: cross-cutting-infrastructure-declarations-defining-clo-e758
description: "Google Cloud Provider Adoption for Runtime Deployment Target: Infrastructure Declarations Defining Cloud Execution Targets"
metadata:
  actual:
    adr_id: e758df2a-c915-4ec5-aba7-c8b8b81d3a2f
    status: accepted
    candidate_group_id: b6937f1b-8b59-41c1-af4b-6d3c76339a0b
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# Google Cloud Provider Adoption for Runtime Deployment Target: Infrastructure Declarations Defining Cloud Execution Targets

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for infrastructure modules declaring cloud execution targets and hosting environments, and declarative provider definitions managing cloud runtime resources.

### Rules

- **R-GCP-001** MUST: Infrastructure declarations defining cloud execution targets MUST configure the Google provider block with explicit parameterization for project identifier and regional locality.

### Verify

```bash
# Discover and execute the repository infrastructure formatting and syntax validation script against all provider definition files.
# Discover and run the infrastructure plan validation command to ensure provider configuration resolves valid project and regional parameters without error.
```

**Accept when:**
- Infrastructure validation commands return exit code zero with no syntax or semantic errors.
- Provider configuration successfully initializes with the exact locked provider version and binds to the resolved environment variables.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>