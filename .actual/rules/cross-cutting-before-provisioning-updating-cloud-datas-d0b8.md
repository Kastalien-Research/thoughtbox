---
version: 2
name: cross-cutting-before-provisioning-updating-cloud-datas-d0b8
description: "google_storage_bucket Primary Datastore Architecture: Before Provisioning Updating Cloud Datastore Resource"
metadata:
  actual:
    adr_id: d0b882e3-fb57-4d0e-9ab1-c8d56c3374a9
    status: accepted
    candidate_group_id: c2e54271-8fb6-48d6-975d-fd4dc76907a6
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_storage_bucket Primary Datastore Architecture: Before Provisioning Updating Cloud Datastore Resource

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for all files matching the configured scope.

### Rules

- **R-GCS-001** MUST: Before provisioning or updating the cloud datastore resource, the consumer MUST inspect the repository lock artifact to determine the exact resolved provider version and validate that declared attributes comply with that resolved version.

### Verify

```bash
# Discover and execute the project's infrastructure validation and static analysis suite to verify datastore resource attributes.
# Execute the project's configuration drift detection process to confirm active cloud resources match declared bucket specifications.
```

**Accept when:**
- Static analysis confirms that all declared primary datastore bucket resources configure uniform bucket-level access enabled and force destruction disabled.
- Infrastructure execution dry-run completes successfully without detecting configuration drift or unvalidated attribute mutations.

<enforcement>
Claude Code MUST NOT skip or defer verification. Continuous integration validation workflows evaluate infrastructure definitions against security policy engines and peer review.
</enforcement>