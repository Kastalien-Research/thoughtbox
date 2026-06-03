# ADR-GCP-02: Secret Manager for Supabase Credentials

**Status**: Accepted

## Context
The application is migrating to a dual-backend model supporting both local filesystem and hosted Supabase instances (`THOUGHTBOX_STORAGE=supabase`). To connect to Supabase, the application requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET`. 

Currently, the primary HTTP server (`thoughtbox-mcp`) accesses these through GCP Secret Manager (as defined in `cloud-run-service.yaml`). However, the isolated agent runbooks (deployed via Terraform as a Cloud Run Job) do not have managed access to these secrets. Relying on `scripts/push-secrets.sh` to manually create and manage secrets outside of Terraform breaks Infrastructure as Code invariants and risks configuration drift or missing credentials during silent fallbacks.

## Decision
We will formally manage all Supabase credentials via Terraform using `google_secret_manager_secret` and `google_secret_manager_secret_version` (or at least the secret metadata and IAM bindings). 
We will grant the `agent-runner-sa` IAM role `roles/secretmanager.secretAccessor` for these secrets.
We will mount these secrets as environment variables inside the `google_cloud_run_v2_job.agent_runner` definition.

## Consequences
- **Positive:** Agent runbooks can securely connect to Supabase without plaintext `.env` files. Access is trackable and reversible via IAM.
- **Positive:** Infrastructure configuration drift is eliminated.
- **Negative/Tradeoff:** Local testing using the Cloud Run emulator or direct Docker containers requires pulling these secrets down explicitly or maintaining `.env.local` files for engineers.

## Hypotheses

### Hypothesis H1: Agent Runner Cloud Run Job receives valid Supabase environment variables
**Prediction**: The `google_cloud_run_v2_job.agent_runner` definition explicitly mounts `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` mapping to the respective Secret Manager keys.
**Validation**: Running `terraform plan` produces a diff creating these environment blocks linked to `secretKeyRef` fields.
**Outcome**: PASS

### Hypothesis H2: Agent Runner Service Account can read the Supabase secrets
**Prediction**: The `google_secret_manager_secret_iam_member.agent_runner_access` block creates bindings granting the `agent-runner-sa` read access for the specific new Supabase secrets.
**Validation**: Running `terraform plan` produces IAM binding additions for the 4 specific secrets.
**Outcome**: PASS

## Spec
See [gcp-02-secret-manager.md](../../.specs/gcp-02-secret-manager.md)

## Links
- Epic: tb-ayr
- Parent Module: GCP Stabilization
