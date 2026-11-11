---
version: 2
name: cross-cutting-google-storage-bucket-resource-set-3a4a
description: "google_storage_bucket Primary Datastore Architecture: Google Storage Bucket Resource Set Uniform"
metadata:
  actual:
    adr_id: 3a4a61e0-7aed-4f82-a295-5ff5b2e90dd1
    status: accepted
    candidate_group_id: c2e54271-8fb6-48d6-975d-fd4dc76907a6
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_storage_bucket Primary Datastore Architecture: Google Storage Bucket Resource Set Uniform

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-GCS-001** MUST: The `google_storage_bucket` resource MUST set `uniform_bucket_level_access` to true, enforcing uniform identity and access management policies and disabling per-object access control lists.

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