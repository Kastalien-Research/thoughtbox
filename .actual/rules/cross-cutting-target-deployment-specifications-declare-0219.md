---
version: 2
name: cross-cutting-target-deployment-specifications-declare-0219
description: "Google Cloud Provider Adoption for Runtime Deployment Target: Target Deployment Specifications Declare Required Provider"
metadata:
  actual:
    adr_id: 021923bd-3f0d-49b8-a2f4-1b84dc934a56
    status: accepted
    candidate_group_id: b6937f1b-8b59-41c1-af4b-6d3c76339a0b
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# Google Cloud Provider Adoption for Runtime Deployment Target: Target Deployment Specifications Declare Required Provider

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for infrastructure modules declaring cloud execution targets, hosting environments, and declarative provider definitions managing cloud runtime resources.

### Rules

- **R-GCP-001** MUST: Target deployment specifications MUST declare required provider constraints and state backend persistence configurations within the root infrastructure module.

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