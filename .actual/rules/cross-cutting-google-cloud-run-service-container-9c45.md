---
version: 2
name: cross-cutting-google-cloud-run-service-container-9c45
description: "google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Google Cloud Run Service Container Definitions"
metadata:
  actual:
    adr_id: 9c45c736-e6e1-4f7a-9e54-9c7b9fd927b8
    status: accepted
    candidate_group_id: 64553d8f-35f8-4197-a3c1-189a3f1e5b88
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Google Cloud Run Service Container Definitions

Scope: applies to `infra/gcp/**`.

These rules are ALWAYS ACTIVE for containerized cloud service resource definitions and infrastructure configuration modules managing environment variable injection for runtime containers.

### Rules

- **R-GCR-001** MUST: In google_cloud_run_v2_service container definitions, sensitive credentials MUST be bound using value_source secret_key_ref referencing google_secret_manager_secret resources rather than plaintext values.

### Verify

```bash
# Discover and execute the repository infrastructure validation scripts to verify that container environment declarations conform to secret reference standards.
# Run the repository configuration policy checker to confirm that no plaintext credentials or sensitive keys exist in environment variable definitions.
```

**Accept when:**
- Infrastructure validation succeeds with all sensitive environment variables configured via managed secret key references.
- No plaintext secrets or authentication tokens are detected in static container environment definitions.

<enforcement>
Claude Code MUST NOT skip or defer verification. Verification is mandatory via automated infrastructure policy linting, static analysis, and mandatory peer code review.
</enforcement>