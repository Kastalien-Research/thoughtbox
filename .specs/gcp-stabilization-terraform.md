# GCP Stabilization Terraform Specification

## 1. Overview
This specification details the IaC (Infrastructure as Code) implementation for the Thoughtbox GCP Stabilization architecture (ADR-015) using Terraform. It defines the "what" of the state transition constraints and IAM boundaries required to securely execute agents.

## 2. Directory Structure
The Terraform code will reside in `infra/gcp/`:
- `main.tf`: Provider configuration (Google and GitHub), backend setup (GCS).
- `variables.tf` / `terraform.tfvars`: Project ID, region, GitHub configuration parameters.
- `iam.tf`: Service accounts and role bindings.
- `storage.tf`: Artifact registry and GCS buckets.
- `execution.tf`: Cloud Run Job and Secret Manager resources.
- `automation.tf`: Cloud Scheduler.
- `github.tf`: Branch protection rules and GitHub App configurations.

## 3. Provider Configuration
- **Google Provider**: Bound to project `thoughtbox-prod`, region `us-central1`.
- **GitHub Provider**: Authenticated either via an exported `GITHUB_TOKEN` environment variable or via an explicitly defined GitHub App installation. Must have `repo` scope permissions.

## 4. Resource Definitions

### 4.1. Identities (IAM)
- **Service Account: `agent-runner-sa`**
  - **Roles**: `roles/run.invoker` (if needed for internal chaining), `roles/secretmanager.secretAccessor` (scoped only to specific secrets), `roles/storage.objectAdmin` (scoped to the run artifacts bucket).
  - Explicitly lacks `roles/editor`, `roles/owner`, or broader project permissions.
- **Service Account: `build-system-sa`**
  - **Roles**: `roles/artifactregistry.writer`

### 4.2. Storage & Artifacts
- **Artifact Registry Repository**: `agent-runner-repo` (format: DOCKER).
- **GCS Bucket**: `thoughtbox-run-artifacts`
  - `uniform_bucket_level_access` = true.

### 4.3. Secrets Management
- **Secrets**: `anthropic-api-key`, `github-app-private-key`, `github-app-id`, `github-app-installation-id`.
- **Constraint**: Terraform manages the Secret *resources* (`google_secret_manager_secret`), and the IAM policy binding the `agent-runner-sa` as an accessor. The Secret *versions* (`google_secret_manager_secret_version`) can be populated manually via the GCP console to avoid tracking highly sensitive keys in Terraform state if preferred, but for initial bootstrapping, placeholder values can be used.

### 4.4. Execution (Cloud Run Job)
- **Job**: `agent-runner-job`
  - `image`: Pinned SHA or placeholder image initially.
  - `service_account`: Attached to `agent-runner-sa`.
  - `env`: Includes `AGENTS_DISABLED` flag (default `"false"`).
  - `secret_env`: Mounts the secrets defined in 4.3.
  - `execution_environment`: `EXECUTION_ENVIRONMENT_GEN2`.
  - `timeout`: `1800s` (30m).
  - `task_count`: 1.

### 4.5. Automation
- **Cloud Scheduler Job**: `sil-runner`
  - `schedule`: "0 2 * * 0"
  - `state`: `PAUSED`

### 4.6. GitHub Integration
- **Branch Protection**: Requires configuring the `main` branch.
  - `enforce_admins`: true.
  - `required_status_checks`: E.g., `ci`, `workflow-guard`.
  - `required_pull_request_reviews`: At least 1 approval.
  - Limits pushes.

## 5. Acceptance Criteria
- `terraform plan` succeeds without errors.
- `gcloud` assertions (post-apply) confirm the `agent-runner-sa` has no primitive Editor/Owner roles.
- The Cloud Run Job mounts exactly the specified secrets and uses the assigned SA.
- The GitHub branch protection rules require PRs and block direct pushes to `main`.
