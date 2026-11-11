---
version: 2
name: 1a433fb7-03be-4f17-8807-94459b76bb6f-adoption-of-dotenv-for-script-runtime-environment-configuration-standalone-scripts-encapsulate-environment-variable-retrieval
description: "Adoption of dotenv for Script Runtime Environment Configuration: Standalone Scripts Encapsulate Environment Variable Retrieval"
metadata:
  actual:
    adr_id: 1a433fb7-03be-4f17-8807-94459b76bb6f
    status: accepted
    candidate_group_id: 4e4e5342-49b8-44a6-a6de-c337a61417e3
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of dotenv for Script Runtime Environment Configuration: Standalone Scripts Encapsulate Environment Variable Retrieval

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `scripts/**`

## Context

- Standalone execution scripts, evaluation harnesses, and probe monitors require runtime credentials and external configuration parameters to interact with data stores and external services.
- Ad-hoc environment variable management across standalone automation scripts risks credential leakage, inconsistent configuration loading, and runtime initialization failures.
- Multiple scripting entry points across automation harnesses and evaluation pipelines require a unified mechanism to populate process runtime environments without coupling source code to concrete deployment environments.
- Surrounding script workloads coordinate multiple dependent services including agent evaluation frameworks and client libraries, necessitating predictable environment initialization prior to executing data store or API queries.

## Problem Statement

Standalone probe, evaluation, and monitoring scripts require access to external service keys and runtime configuration settings without hardcoding secrets into source control or relying on host-level environment pre-population. Without a standardized runtime library for loading environment definitions into the process environment, script executions encounter divergent configuration loading semantics, missing runtime credentials, and degraded reproducibility across operational environments.

## Decision

1. SHOULD: Standalone scripts SHOULD encapsulate environment variable retrieval within dedicated configuration accessors rather than referencing raw process environment variables across distributed functional logic.

## Policy Block

- SHOULD Standalone scripts SHOULD encapsulate environment variable retrieval within dedicated configuration accessors rather than referencing raw process environment variables across distributed functional logic.

In scope:
- Standalone automation scripts, test harnesses, evaluation runners, and probe monitors executing outside containerized application servers.
- Utility entry points that initialize external service clients requiring API keys, endpoints, or environment-specific runtime configurations.

Out of scope:
- Production server applications running in containerized environments where environment variables are directly injected by platform orchestrators.
- Pure utility libraries and modules that do not declare an independent execution entry point.

## Rationale

- Adopting a standardized runtime library across standalone script entry points ensures uniform environment population and prevents diverging initialization semantics.
- Centralizing process environment initialization through dotenv decouples sensitive credentials from tracked code repositories while maintaining parity across local test harnesses and automated evaluation environments.
- Fail-fast validation following environment loading prevents partial script execution with incomplete external service credentials.

## Consequences

Positive:
- Standardizes environment variable injection across independent execution scripts, test harnesses, and probe monitors.
- Eliminates hardcoded credentials and configuration parameters from tracked source files.
- Provides deterministic script behavior across diverse execution environments by ensuring required configuration parameters are loaded prior to client initialization.

Negative:
- Introduces an external runtime dependency that must be maintained and tracked across repository manifests.
- Requires developers to manage out-of-band environment variable declarations across each local execution environment.
- Creates execution order coupling where modules imported before environment initialization may read undefined configuration values.

## Alternatives

- Rely exclusively on host-level shell environment variable exports without a file-based loader library (rejected)
  Rejected because: Manual management of shell exports across independent script executions increases operational friction and frequently introduces runtime failures due to missing environment variables.
  When valid: Valid in production containerized runtimes where platform orchestrators inject environment variables natively.
- Implement a custom bespoke parser for local configuration definition files (rejected)
  Rejected because: A custom parser introduces unnecessary maintenance overhead, security risk, and edge-case handling bugs for functionality already solved by standard libraries.
  When valid: Valid in environments with strict zero-dependency constraints where external libraries are prohibited.

## Risks

- Accidental committal of local environment configuration files containing sensitive credentials to version control.
  Mitigation: Ensure repository ignore definitions exclude local environment configuration artifacts and enforce secret detection during automated pipeline reviews.
  Owner: Engineering Team
- Downstream modules attempting to read process environment variables before the initialization function completes.
  Mitigation: Enforce early initialization at the absolute top of script entry points and validate critical configuration presence before client instantiations.
  Owner: Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Ensure configuration initialization occurs synchronously at script entry points before initializing external client instances or accessing process environment values.
- Implement clear error logging with remediation instructions when required environment variables are absent upon initialization.

## Continuation Context


Verify commands:
- Discover and run the project static analysis and linting checks declared in the repository build manifest to verify environment variable access patterns.
- Discover and execute script verification test suites from the project manifest to confirm configuration loading behavior across probe and evaluation scripts.

Accept when:
- All script entry points initialize environment configuration using the adopted library prior to reading process environment variables.
- Repository verification test suites and static analysis checks pass without configuration loading errors or missing credential diagnostics.

## Enforcement

- Verified by: Automated continuous integration checks executing repository test suites and static analysis linters.
- Verified by: Peer code review verifying early initialization and absence of hardcoded secrets in pull requests.
- Violation handling: Pull requests containing hardcoded credentials or uninitialized environment access are blocked until corrected.
- Exception process: Exceptions for scripts operating under custom runtime orchestrators must be documented and approved by the architecture review panel.