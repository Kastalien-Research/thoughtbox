---
version: 2
name: cross-cutting-bucket-name-assigned-google-storage-bd92
description: "google_storage_bucket Primary Datastore Architecture: Bucket Name Assigned Google Storage Incorporate"
metadata:
  actual:
    adr_id: bd923f07-d7b6-4451-b74d-2580ba2a50c7
    status: accepted
    candidate_group_id: c2e54271-8fb6-48d6-975d-fd4dc76907a6
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_storage_bucket Primary Datastore Architecture: Bucket Name Assigned Google Storage Incorporate

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-GCS-001** MUST: The bucket name assigned to `google_storage_bucket` MUST incorporate an environment project identifier variable to ensure globally unique namespace isolation.

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