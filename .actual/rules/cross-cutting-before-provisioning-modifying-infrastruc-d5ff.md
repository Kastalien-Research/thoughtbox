---
version: 2
name: cross-cutting-before-provisioning-modifying-infrastruc-d5ff
description: "Google Cloud Provider Adoption for Runtime Deployment Target: Before Provisioning Modifying Infrastructure Definitions Engineers"
metadata:
  actual:
    adr_id: d5ff0961-1ea0-4763-83c3-049fa97ad034
    status: accepted
    candidate_group_id: b6937f1b-8b59-41c1-af4b-6d3c76339a0b
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# Google Cloud Provider Adoption for Runtime Deployment Target: Before Provisioning Modifying Infrastructure Definitions Engineers

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for infrastructure modules declaring cloud execution targets, hosting environments, and declarative provider definitions managing cloud runtime resources.

### Rules

- **R-GCP-001** MUST: Before provisioning or modifying infrastructure definitions, engineers MUST locate the repository dependency lock artifact to resolve and pin the exact provider version required by the runtime environment.

### Verify

```bash
# Discover and execute the repository infrastructure formatting and syntax validation script against all provider definition files.
# Discover and run the infrastructure plan validation command to ensure provider configuration resolves valid project and regional parameters without error.
```

**Accept when:**
- Infrastructure validation commands return exit code zero with no syntax or semantic errors.
- Provider configuration successfully initializes with the exact locked provider version and binds to the resolved environment variables.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verified by automated continuous integration checks and mandatory peer review by platform engineers.
</enforcement>