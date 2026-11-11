---
version: 2
name: cross-cutting-regional-infrastructure-resources-align-563b
description: "Google Cloud Provider Adoption for Runtime Deployment Target: Regional Infrastructure Resources Align Region Attribute"
metadata:
  actual:
    adr_id: 563b3c29-ca9c-47f0-9bdb-dcf5bd765295
    status: accepted
    candidate_group_id: b6937f1b-8b59-41c1-af4b-6d3c76339a0b
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# Google Cloud Provider Adoption for Runtime Deployment Target: Regional Infrastructure Resources Align Region Attribute

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for infrastructure modules declaring cloud execution targets, hosting environments, and declarative provider definitions managing cloud runtime resources.

### Rules

- **R-GCP-001** SHOULD: Regional infrastructure resources align with the region attribute designated in the active Google provider configuration block to prevent unintended cross-region data egress.

### Verify

```bash
# Discover and execute the repository infrastructure formatting and syntax validation script against all provider definition files
# Discover and run the infrastructure plan validation command to ensure provider configuration resolves valid project and regional parameters without error
```

**Accept when:**
- Infrastructure validation commands return exit code zero with no syntax or semantic errors.
- Provider configuration successfully initializes with the exact locked provider version and binds to the resolved environment variables.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>