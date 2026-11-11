---
version: 2
name: cross-cutting-google-storage-bucket-resource-configure-5452
description: "google_storage_bucket Primary Datastore Architecture: Google Storage Bucket Resource Configure Multi"
metadata:
  actual:
    adr_id: 5452b093-9ca9-444a-8589-3304a9cc1dfb
    status: accepted
    candidate_group_id: c2e54271-8fb6-48d6-975d-fd4dc76907a6
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_storage_bucket Primary Datastore Architecture: Google Storage Bucket Resource Configure Multi

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for all cloud infrastructure definitions declaring primary object datastores for execution and run artifact persistence.

### Rules

- **R-GSB-001** SHOULD: The `google_storage_bucket` resource SHOULD configure multi-region geographic placement to ensure cross-regional data durability and high availability.

### Verify

```bash
# Discover and execute the project's infrastructure validation and static analysis suite to verify datastore resource attributes.
# Execute the project's configuration drift detection process to confirm active cloud resources match declared bucket specifications.
```

**Accept when:**
- Static analysis confirms that all declared primary datastore bucket resources configure uniform bucket-level access enabled and force destruction disabled.
- Infrastructure execution dry-run completes successfully without detecting configuration drift or unvalidated attribute mutations.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration validation workflows and peer reviews evaluate infrastructure definitions against security policy engines.
</enforcement>