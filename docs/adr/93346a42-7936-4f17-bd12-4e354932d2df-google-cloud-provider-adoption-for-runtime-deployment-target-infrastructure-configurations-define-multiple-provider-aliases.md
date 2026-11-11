---
version: 2
name: 93346a42-7936-4f17-bd12-4e354932d2df-google-cloud-provider-adoption-for-runtime-deployment-target-infrastructure-configurations-define-multiple-provider-aliases
description: "Google Cloud Provider Adoption for Runtime Deployment Target: Infrastructure Configurations Define Multiple Provider Aliases"
metadata:
  actual:
    adr_id: 93346a42-7936-4f17-bd12-4e354932d2df
    status: accepted
    candidate_group_id: b6937f1b-8b59-41c1-af4b-6d3c76339a0b
    evidence:
      source: deep
  scope:
    root: infra/gcp
---

# Google Cloud Provider Adoption for Runtime Deployment Target: Infrastructure Configurations Define Multiple Provider Aliases

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `infra/gcp`

Applies to:
- `**` (whole root)

## Context

- The system requires a defined runtime deployment target for hosting services and infrastructure components across designated environments.
- Cloud resource definitions require isolated project partitioning and regional localization to satisfy data residency, latency, and administrative boundaries.
- Adopting declarative provider configurations with variable bindings enables multi-environment portability without duplicating infrastructure definitions.
- State backend persistence and required provider declarations ensure deterministic resource lifecycle management across engineering workflows.

## Problem Statement

Without a standardized cloud deployment target and formalized provider configuration, infrastructure definitions risk inconsistent runtime placement, hardcoded environmental identifiers, and non-reproducible state management across environments.

## Decision

1. MAY: Infrastructure configurations MAY define multiple provider aliases for the Google provider when multi-region or cross-project resource orchestration is explicitly required.

## Policy Block

- MAY Infrastructure configurations MAY define multiple provider aliases for the Google provider when multi-region or cross-project resource orchestration is explicitly required.

In scope:
- Infrastructure modules declaring cloud execution targets and hosting environments
- Declarative provider definitions managing cloud runtime resources

Out of scope:
- Local container runtime definitions executed purely for local developer simulation
- Third-party SaaS configurations that do not provision cloud hosting infrastructure

## Rationale

- Parameterizing project identifier and region attributes inside the provider block establishes clear environment isolation between staging, production, and sandbox environments.
- Explicit provider requirements and backend definitions guarantee that infrastructure state and provider execution contracts remain deterministic across automated execution pipelines.
- Standardizing on the Google cloud provider provides a cohesive runtime target for deploying services and managed infrastructure.

## Consequences

Positive:
- Eliminates hardcoded environment values and unifies runtime target definitions under structured variable inputs.
- Ensures reproducible cloud environment provisioning across staging, testing, and production infrastructure.
- Formalizes backend state persistence and provider dependency tracking for cloud resources.

Negative:
- Introduces operational coupling to Google Cloud platform services and resource schemas.
- Requires strict governance of variable inputs across separate deployment pipelines to prevent misconfigured project targets.

## Alternatives

- Direct manual provisioning through cloud management console or imperative script execution (rejected)
  Rejected because: Manual and imperative provisioning creates configuration drift, lacks state tracking, and does not provide auditable declarative target declarations.
  When valid: Rapid prototyping or emergency diagnostic inspections where declarative infrastructure has not yet been established.
- Multi-cloud agnostic provider abstraction layer (rejected)
  Rejected because: Generic abstractions conceal provider-specific infrastructure capabilities and impose artificial lowest-common-denominator constraints without delivering practical cross-cloud mobility.
  When valid: Deployments with mandatory multi-cloud redundancy requirements mandated by regulatory compliance.

## Risks

- Provider version upgrades may introduce breaking attribute schemas or state migration requirements.
  Mitigation: Enforce provider dependency lock file resolution in continuous integration pipelines before applying changes.
  Owner: Platform Engineering Team
- Misconfigured variable inputs could target the wrong project or deployment region.
  Mitigation: Validate project identifier and region variable inputs against environment-specific approval policies before execution.
  Owner: Platform Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Discover the infrastructure manifests and variable definition files within the repository to inspect all accepted input variables for project and region identification.
- Verify that state backend configurations reference secure remote storage buckets corresponding to the target cloud provider.

## Continuation Context


Verify commands:
- Discover and execute the repository infrastructure formatting and syntax validation script against all provider definition files.
- Discover and run the infrastructure plan validation command to ensure provider configuration resolves valid project and regional parameters without error.

Accept when:
- Infrastructure validation commands return exit code zero with no syntax or semantic errors.
- Provider configuration successfully initializes with the exact locked provider version and binds to the resolved environment variables.

## Enforcement

- Verified by: Automated continuous integration checks that validate infrastructure definitions against static analysis rules and schema constraints.
- Verified by: Mandatory peer review by platform engineers for any modifications to provider blocks or backend configurations.
- Violation handling: Pull requests containing hardcoded project identifiers, regions, or unpinned provider definitions are automatically blocked from merging.
- Exception process: Exceptions for multi-region provider aliases or temporary non-standard provider parameters require written sign-off from the platform lead documented in the change request.