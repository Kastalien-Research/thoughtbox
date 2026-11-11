---
version: 2
name: cross-cutting-google-storage-bucket-resource-not-aecb
description: "google_storage_bucket Primary Datastore Architecture: Google Storage Bucket Resource Not Enable"
metadata:
  actual:
    adr_id: aecbbd43-cc78-45bc-af4b-ad9fc045340a
    status: accepted
    candidate_group_id: c2e54271-8fb6-48d6-975d-fd4dc76907a6
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_storage_bucket Primary Datastore Architecture: Google Storage Bucket Resource Not Enable

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for cloud infrastructure definitions declaring primary object datastores for execution and run artifact persistence.

### Rules

- **R-STOR-001** MUST_NOT: The `google_storage_bucket` resource MUST_NOT enable `force_destroy`, ensuring that buckets containing run artifacts cannot be deleted when non-empty.

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