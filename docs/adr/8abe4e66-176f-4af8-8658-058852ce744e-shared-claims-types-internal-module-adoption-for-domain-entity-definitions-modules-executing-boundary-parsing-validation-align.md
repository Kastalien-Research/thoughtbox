---
version: 2
name: 8abe4e66-176f-4af8-8658-058852ce744e-shared-claims-types-internal-module-adoption-for-domain-entity-definitions-modules-executing-boundary-parsing-validation-align
description: "Shared claims/types Internal Module Adoption for Domain Entity Definitions: Modules Executing Boundary Parsing Validation Align"
metadata:
  actual:
    adr_id: 8abe4e66-176f-4af8-8658-058852ce744e
    status: accepted
    candidate_group_id: 87456ae2-1f8f-40b8-9947-3246b2f2ea4d
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/events/**
      - src/merge-evidence/**
      - src/merge/**
---

# Shared claims/types Internal Module Adoption for Domain Entity Definitions: Modules Executing Boundary Parsing Validation Align

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/events/**`
- `src/merge-evidence/**`
- `src/merge/**`

## Context

- Multiple independent subsystems including event emission, merge evidence synthesis, and claim graph diffing operate on shared domain representations of claims.
- Subsystems need consistent structural contracts to exchange claim entities across runtime boundaries without structural mismatch or drift.
- Static analysis identified uniform consumption of the centralized claims/types internal module across all claim-handling subsystems.

## Problem Statement

Without a centralized, authoritative domain module for core claim data structures, disparate subsystems such as event notification, merge resolution, and evidence recording develop divergent entity contracts, introducing structural drift and runtime serialization failures across subsystem boundaries.

## Decision

1. SHOULD: Modules executing boundary parsing or validation SHOULD align their runtime schema contracts with the static domain definitions exported by the claims/types module.

## Policy Block

- SHOULD Modules executing boundary parsing or validation SHOULD align their runtime schema contracts with the static domain definitions exported by the claims/types module.

In scope:
- All internal modules and subsystems that create, transform, persist, or emit claim entities.
- Cross-cutting services operating across merge, evidence, and event boundaries.

Out of scope:
- Modules that deal purely with peripheral infrastructure concerns without manipulating claim domain entities.
- External third-party integration adapters that require distinct external boundary contracts before domain mapping.

## Rationale

- Centralizing claim type contracts in the claims/types internal module provides a single authoritative domain model shared across all processing stages.
- Observed evidence across 4 files demonstrates that event emitters, diff analyzers, and evidence generators depend on identical claim structures for consistent cross-boundary communication.
- Establishing a standardized internal module avoids redundant interface maintenance and protects boundary interfaces against unintentional divergence.

## Consequences

Positive:
- Guarantees structural consistency of claim entities across event publishing, evidence synthesis, and graph comparison pipelines.
- Eliminates redundant type declarations and reduces the probability of subtle runtime serialization bugs.
- Simplifies cross-module refactoring by providing a single canonical source of truth for core domain data structures.

Negative:
- Changes to shared domain entity definitions introduce broad downstream impact requiring coordinated validation across all dependent modules.
- Risk of shared domain types accumulating peripheral fields that belong to specialized subsystems rather than core entities.

## Alternatives

- Decentralized domain type definitions declared locally within each subsystem (rejected)
  Rejected because: Declaring duplicate entity shapes across event emission, merge evidence generation, and graph diffing causes schema divergence and increases serialization errors across boundary interfaces.
  When valid: Valid only when subsystems are completely isolated services with distinct domain models and zero direct internal module dependencies.
- Automated code generation of static interfaces from runtime validation schemas (deferred)
  Rejected because: Introduces additional build-phase orchestration complexity when static domain contracts currently fulfill cross-boundary modeling needs with minimal overhead.
  When valid: Valid when all domain consumers require runtime boundary validation and automated synchronization from a single schema source.

## Risks

- A breaking change in the shared domain module cascades across multiple consuming subsystems simultaneously.
  Mitigation: Enforce additive-only, backward-compatible updates for shared type definitions, coupled with repository-wide automated type and regression tests.
  Owner: engineering team
- The shared domain types module becomes bloated with specialized properties not relevant to all consuming boundaries.
  Mitigation: Conduct architectural reviews to ensure the shared module encapsulates only core domain entities rather than subsystem-specific concerns.
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
- When extending domain contracts, prioritize backward-compatible additions and update all dependent subsystem fixtures synchronously.
- Ensure that runtime validation schemas validating external payloads align structurally with the static definitions exported by the shared domain module.

## Continuation Context


Verify commands:
- Discover and run the project type-checking script to confirm that all claim type imports resolve to the canonical domain module without structural mismatches.
- Discover and execute the repository test runner across consuming subsystems to validate domain contract compatibility across boundaries.

Accept when:
- Type-checking verification confirms zero structural type mismatches across all subsystems importing canonical claim definitions.
- All consumer test suites execute successfully with valid canonical claim entity fixtures.

## Enforcement

- Verified by: Automated type-checking across all project modules during continuous integration.
- Verified by: Mandatory architectural and code review checks for pull requests modifying domain contracts.
- Violation handling: Continuous integration builds fail upon detection of local type declarations shadowing canonical claim entities.
- Violation handling: Pull requests introducing divergent claim models are rejected until refactored to consume the centralized module.
- Exception process: Submit an architectural exception request documenting why specialized subsystem requirements cannot be satisfied by canonical claims/types structures.
- Exception process: Obtain formal approval from the domain architecture team prior to committing local domain type variations.