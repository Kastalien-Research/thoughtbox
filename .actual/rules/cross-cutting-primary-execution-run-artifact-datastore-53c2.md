---
version: 2
name: cross-cutting-primary-execution-run-artifact-datastore-53c2
description: "google_storage_bucket Primary Datastore Architecture: Primary Execution Run Artifact Datastores Provisioned"
metadata:
  actual:
    adr_id: 53c27f98-d380-481c-837e-5f4a223994ff
    status: accepted
    candidate_group_id: c2e54271-8fb6-48d6-975d-fd4dc76907a6
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_storage_bucket Primary Datastore Architecture: Primary Execution Run Artifact Datastores Provisioned

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-STOR-001** MUST: Primary execution run artifact datastores MUST be provisioned using `google_storage_bucket` resources configured with uniform bucket-level access enabled.

### Verify

```bash
# Discover and execute the project's infrastructure validation and static analysis suite to verify datastore resource attributes.
# Execute the project's configuration drift detection process to confirm active cloud resources match declared bucket specifications.
```

**Accept when:**
- Static analysis confirms that all declared primary datastore bucket resources configure uniform bucket-level access enabled and force destruction disabled.
- Infrastructure execution dry-run completes successfully without detecting configuration drift or unvalidated attribute mutations.

<enforcement>
Claude Code MUST NOT skip or defer verification.
</enforcement>