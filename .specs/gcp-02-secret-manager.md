# Specification: Secret Manager for Supabase

## Overview
This specification details the Terraform resource modifications required to support Supabase connectivity in the agent runner Cloud Run Job, ensuring compliance with ADR-GCP-02.

## Resource Modifications: `infra/gcp/execution.tf`

### 1. New Secrets
Four new `google_secret_manager_secret` resources must be defined. Note: We will define the *secrets* in Terraform but not the `google_secret_manager_secret_version` data payloads directly in source control to prevent plaintext leaks.

Required secrets:
- `secret_id = "supabase-url"`
- `secret_id = "supabase-anon-key"`
- `secret_id = "supabase-jwt-secret"`

### 2. IAM Bindings
The `google_secret_manager_secret_iam_member.agent_runner_access` block uses a `for_each` loop. We must add the new `google_secret_manager_secret.*.secret_id` fields to this `for_each` set to explicitly grant `roles/secretmanager.secretAccessor` to `google_service_account.agent_runner.member`.

### 3. Cloud Run Job Environment
Inside `google_cloud_run_v2_job.agent_runner` -> `template` -> `template` -> `containers`, the following `env` blocks must be added:
```hcl
env {
  name = "SUPABASE_URL"
  value_source {
    secret_key_ref {
      secret  = google_secret_manager_secret.supabase_url.secret_id
      version = "latest"
    }
  }
}
# Repeat for SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET
```

## Resource Modifications: `scripts/push-secrets.sh`

The deployment helper script `scripts/push-secrets.sh` currently uses `gcloud secrets create`. This logic is now redundant and conflicting with Terraform.

### Changes
- Remove `gcloud secrets create` commands completely.
- Retain only `gcloud secrets versions add` to push local `.env` values up into the Terraform-managed Secret shells.

## Acceptance Criteria
- `terraform plan` succeeds and shows ~6 resources added (3 secrets, 3 IAM bindings) and modifications to the Cloud Run Job.
- `scripts/push-secrets.sh` can push new versions without attempting to create the root secrets.
