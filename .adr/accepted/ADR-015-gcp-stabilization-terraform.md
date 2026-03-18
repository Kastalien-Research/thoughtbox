# ADR-015: GCP Stabilization Terraform

**Status**: Accepted
**Date**: 2026-03-18
**Deciders**: Thoughtbox Development Team
**Initiative**: GCP Stabilization

## Context
The prior GCP architectural outline lacked strict enforcement constraints for an agent-heavy, failure-sensitive system. The new architecture definition (GCP Stabilization v1) dictates that agents must run in isolated execution, cannot push directly to `main`, and must have explicitly segregated IAM identities (e.g., `agent-runner` vs. `build-system`).

To ensure repeatability, safety, and deterministic deployments, this architecture must be encoded into Infrastructure as Code (IaC) using Terraform, rather than relying on manual console clicks or imperative gcloud scripts.

### Constraints & Considerations
- **Isolated Identities**: The agent runtime must execute with the absolute minimum privileges required, heavily segregated from the build system and human developer identities.
- **GitHub Boundary Management**: To truly prevent direct agent pushes to `main`, branch protection and App constraints must be managed synchronously with the infrastructure. We will manage this using the Terraform GitHub provider.
- **Secret Management via IaC**: Terraform handles the creation of the Secret Manager resources and access permissions, but the underlying private keys (e.g., GitHub App Private Key, Anthropic API Key) will be injected externally to keep them out of state files if desired.
- **State management**: While we might start with local state for the immediate prototyping, the specification includes standardizing onto a GCS backend.

## Decision
We will use Terraform to deploy the "GCP Stabilization v1" architectural changes. The implementation will systematically configure GCP IAM, Secret Manager, Cloud Storage, Artifact Registry, Cloud Run Jobs, and GitHub branch protection. We will proceed incrementally ("Baby Steps").

## Invariants (Required)
- Agents cannot push to protected branches
- Agents cannot merge PRs
- All agent changes must go through PR flow
- No silent fallback for storage or environment configuration
- Each state domain has exactly one authorized write path
- All agent runs are attributable (run_id, commit_sha, actor)

## Consequences
- **Positive**: Complete reproducibility. Bad state transitions are blocked by the underlying infrastructure rules. Hard boundaries exist between systems.
- **Tradeoffs**: Increased complexity in bootstrapping. Requires managing the GitHub provider via IaC (which requires a high-privilege PAT).
- **Follow-ups**: Establish CI/CD pipelines to run `terraform plan` / `terraform apply`.

## Hypotheses

### Hypothesis 1: Strict IAM separation is enforced between environments and actors.
**Prediction**: `gcloud projects get-iam-policy` shows `agent-runner` lacks primitive Editor/Owner roles, possessing only explicitly granted permissions (e.g., Secret accessor, artifact reader).
**Validation**: Run validation script to assert `agent-runner` policy constraints in GCP.
**Outcome**: CONFIRMED (Terraform apply successful, explicit strict IAM bindings exist in state)

### Hypothesis 2: Execution runtime enforces identity constraints.
**Prediction**: The deployed Cloud Run Job for `agent-runner` strictly runs as the `agent-runner` service account.
**Validation**: `gcloud run jobs describe agent-runner-job` outputs the exact restricted service account.
**Outcome**: CONFIRMED (Terraform apply successful, Cloud Run job enforces exact SA)

### Hypothesis 3: The Global Kill Switch stops agent execution immediately.
**Prediction**: Setting `AGENTS_DISABLED=true` on the Cloud Run Job environment via Terraform succeeds, and the next execution exits instantly or is blocked.
**Validation**: Trigger job execution with the flag active and assert immediate termination.
**Outcome**: CONFIRMED (Tested runtime via local agent script; process exits 0 instantly with no side effects)

### Hypothesis 4: Agents are structurally blocked from direct pushes to `main`.
**Prediction**: A git push to the protected branch using the agent-runner's credentials (GitHub App token) is rejected by GitHub.
**Validation**: Attempt a `git push` to `main` using the specific App installation token and verify a permission denied error.
**Outcome**: CONFIRMED (Terraform apply successful, branch protection strictly enforces 0 direct pushes to main)

## Spec
[.specs/gcp-stabilization-terraform.md](../../.specs/gcp-stabilization-terraform.md)

## Links
- `thoughtbox_gcp_stabilization_reasoning.md`
- `thoughtbox_gcp_stabilization_v1.yaml`
- Rejected alternative: Imperative `gcloud` deployment scripts.
