---
version: 2
name: ad62ea88-bbbd-44ec-a909-4c14208dd844-google-cloud-run-v2-service-container-secret-injection-via-google-secret-manager-secret-dynamic-secret-bindings-across-container-environment
description: "google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Dynamic Secret Bindings Across Container Environment"
metadata:
  actual:
    adr_id: ad62ea88-bbbd-44ec-a909-4c14208dd844
    status: accepted
    candidate_group_id: 64553d8f-35f8-4197-a3c1-189a3f1e5b88
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# google_cloud_run_v2_service Container Secret Injection via google_secret_manager_secret: Dynamic Secret Bindings Across Container Environment

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `infra/gcp`

Applies to:
- `**` (whole root)

## Context

- Containerized services require various runtime credentials and non-sensitive configuration values to interface with external backends and authentication providers.
- Embedding credentials directly into container environment definitions exposes sensitive values in source control, infrastructure state files, and container inspection interfaces.
- Infrastructure resources provide dedicated secret management primitives alongside container service definitions that support referenced value sourcing.

## Problem Statement

Container service configurations that mix sensitive credentials with standard configuration settings in plain environment variables risk credential exfiltration, state file exposure, and unauthorized audit visibility across deployment environments.

## Decision

1. SHOULD: Dynamic secret bindings across container environment entries SHOULD iterate over structured mappings of environment keys to managed secret identifiers to maintain configuration consistency.

## Policy Block

- SHOULD Dynamic secret bindings across container environment entries SHOULD iterate over structured mappings of environment keys to managed secret identifiers to maintain configuration consistency.

In scope:
- Containerized cloud service resource definitions that require external API keys, authentication tokens, or storage credentials.
- Infrastructure configuration modules managing environment variable injection for runtime containers.

Out of scope:
- Non-sensitive runtime operational settings including logging flags, deployment environment indicators, and public domain endpoints.
- Local development environments that rely on simulated local secret providers.

## Rationale

- Referencing managed secret resources ensures credentials are encrypted at rest and resolved dynamically during container execution, preventing credential leakage in configuration code.
- Iterating over dynamic mappings for secret key references establishes a uniform convention for secret injection and avoids duplicated configuration blocks.
- Separating non-sensitive operational variables from secret references simplifies configuration auditing by clearly distinguishing public configuration from protected credentials.

## Consequences

Positive:
- Credentials are decoupled from service lifecycle and excluded from source control and infrastructure state outputs.
- Access to secret values is governed by secret management access policies, providing independent audit logging.
- Updating a secret value in the secret manager can be integrated into the container service without altering source configuration files.

Negative:
- Service startup depends on secret manager availability and correct identity access permissions at runtime.
- Referencing secret versions dynamically requires explicit redeployment or version pinning strategies to ensure container instances pick up rotated values reliably.

## Alternatives

- Hardcoded plaintext environment variables in container service definitions (rejected)
  Rejected because: Exposes sensitive credentials in source control, infrastructure state records, and container inspection metadata.
  When valid: Only valid for local mock environments with no access to external networks or production resources.
- Volume-mounted secret files within container filesystems (deferred)
  Rejected because: Requires application runtime modifications to read credentials from filesystem paths instead of standard process environment variables.
  When valid: Valid when handling complex multi-line certificates or credentials required by legacy applications as physical files.

## Risks

- Container deployment failures caused by missing permissions to access referenced secret manager resources.
  Mitigation: Ensure the service runtime identity holds explicit secret accessor permissions for all declared secret resources prior to deployment.
  Owner: engineering team
- Unintended service behavior if secret versions are updated without compatibility verification across active instances.
  Mitigation: Establish rotation workflows that test updated secrets against staging workloads before modifying active versions.
  Owner: engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Define all sensitive configuration parameters in a structured key-to-secret mapping to drive dynamic container environment variable generation.
- Verify that the service identity attached to the container service possesses secret accessor privileges on each corresponding secret resource before deployment.

## Continuation Context


Verify commands:
- Discover and execute the repository infrastructure validation scripts to verify that container environment declarations conform to secret reference standards.
- Run the repository configuration policy checker to confirm that no plaintext credentials or sensitive keys exist in environment variable definitions.

Accept when:
- Infrastructure validation succeeds with all sensitive environment variables configured via managed secret key references.
- No plaintext secrets or authentication tokens are detected in static container environment definitions.

## Enforcement

- Verified by: Automated infrastructure policy linting and static analysis within continuous integration pipelines.
- Verified by: Mandatory peer code review for all modifications to container service definitions and secret resources.
- Violation handling: Continuous integration pipelines fail and block merging for any container configuration exposing plaintext sensitive values.
- Violation handling: Pull requests containing direct credential values in environment variable declarations are rejected.
- Exception process: Exceptions require formal approval from the security architecture team and must be documented with an explicit expiration date and risk assessment.