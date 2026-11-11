---
version: 2
name: c76b75b8-3d73-4ee6-9f8f-52758393daee-adopt-persistence-types-module-for-cross-domain-data-contracts-before-consuming-any-external-libraries-runtime
description: "Adopt Persistence Types Module for Cross-Domain Data Contracts: Before Consuming Any External Libraries Runtime"
metadata:
  actual:
    adr_id: c76b75b8-3d73-4ee6-9f8f-52758393daee
    status: accepted
    candidate_group_id: 7cac724f-731d-4dae-85b3-9841a21eb763
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/audit/**
      - src/hub/**
      - src/observability/**
---

# Adopt Persistence Types Module for Cross-Domain Data Contracts: Before Consuming Any External Libraries Runtime

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/audit/**`
- `src/hub/**`
- `src/observability/**`

## Context

- Multiple functional subsystems require access to persistent entity representations and storage schemas to coordinate hub operations, audit manifest generation, and gateway monitoring.
- Decentralized or duplicated entity definitions across domain boundaries create schema drift and increase the risk of runtime deserialization mismatches.
- An internal persistence types module was introduced to centralize core entity contracts and decouple domain logic from concrete database client implementations.

## Problem Statement

Coordinating operations across domain modules, audit tracking, and gateway interfaces requires shared structural contracts for persistent data. Defining separate entity schemas in each subsystem creates contract fragmentation, maintenance overhead, and elevated risk of schema drift across storage boundaries. A uniform, centralized module for shared persistence type contracts is needed to guarantee cross-boundary consistency while preventing circular coupling between domain services and persistence implementations.

## Decision

1. MUST: Before consuming any external libraries or runtime validation dependencies associated with shared type contracts, consumers MUST inspect the repository lock artifact to resolve and adhere to the exact locked dependency version.

## Policy Block

- MUST Before consuming any external libraries or runtime validation dependencies associated with shared type contracts, consumers MUST inspect the repository lock artifact to resolve and adhere to the exact locked dependency version.

In scope:
- All subsystem modules, storage adapters, audit generators, and gateway handlers interacting with persistent entity state.
- Internal cross-module interfaces sharing data transfer structures derived from persistent records.

Out of scope:
- Ephemeral in-memory data structures strictly local to a single unexported function.
- External third-party integration schemas that do not map to internal persistence entities.

Exceptions:
- EXC-20-001: A subsystem requires an isolated projection model for third-party boundary transformation that cannot conform directly to persistence schemas

## Rationale

- Centralizing type definitions in a dedicated persistence types module establishes a single source of truth for persistent entity structures across hub, audit, and observability domains.
- Decoupling type interfaces from concrete persistence storage engines prevents leaky abstractions and prevents storage drivers from polluting domain layer dependencies.
- Static type sharing eliminates runtime schema divergence across subsystem boundaries while supporting static verification during compilation.

## Consequences

Positive:
- Guarantees schema consistency across adapters, proposals, audit tracking, and gateway operations.
- Reduces codebase maintenance overhead by eliminating redundant type definitions across subsystem boundaries.
- Prevents architectural coupling between domain logic and underlying persistence driver implementations.

Negative:
- Modifications to core persistence contracts require coordinated updates across all dependent subsystems.
- Subsystems cannot independently modify entity shapes without updating the centralized persistence contract.

## Alternatives

- Subsystem-local entity type definitions without a centralized contract module (rejected)
  Rejected because: Leads to schema divergence, redundant interface definitions, and runtime serialization discrepancies between subsystems
  When valid: Microservices architectures where each service maintains independent data stores without shared memory space
- Coupling domain modules directly to concrete storage driver classes and models (rejected)
  Rejected because: Violates architectural separation of concerns and creates tight coupling between domain logic and database drivers
  When valid: Small-scale prototypes where rapid development supersedes modular architectural boundaries

## Risks

- Breaking changes in the persistence types module could ripple across multiple dependent subsystems simultaneously.
  Mitigation: Enforce strict semantic versioning and automated interface validation in continuous integration suites prior to merge.
  Owner: engineering team
- Accumulation of unused or legacy fields in shared types as domain requirements evolve.
  Mitigation: Conduct periodic audit reviews of shared interfaces and deprecate unreferenced attributes systematically.
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
- Discover the designated persistence types module within the repository and ensure all new domain adapters import shared entity interfaces directly from this contract module.
- Ensure boundary handlers validate all incoming external payloads against schemas reflecting the persistence type definitions prior to domain processing.

## Continuation Context


Verify commands:
- Discover and run the project type checking script to verify that all cross-module persistence imports adhere to the centralized types contract without type errors.
- Discover and execute the module boundary verification script to ensure no circular dependencies exist between persistence modules and domain subsystems.
- Discover and run the repository test suite to confirm that storage adapters, proposal handlers, and gateway endpoints pass validation against the centralized entity schemas.

Accept when:
- All subsystem modules import shared persistence entities from the centralized persistence types module without compiler diagnostics.
- Zero circular dependencies are detected between persistence modules and dependent domain services.
- All boundary adapters and operations handlers pass contract verification tests against the centralized schemas.

## Enforcement

- Verified by: Automated static type analysis in the continuous integration pipeline
- Verified by: Architecture boundary and dependency linting checks during build
- Verified by: Peer review during code integration
- Violation handling: Pull requests introducing duplicate persistence type definitions or circular dependencies must be blocked from merging.
- Violation handling: Code review comments must direct contributors to import from the centralized persistence types module.
- Exception process: Submit an architectural review request with justification for localized schema overrides.
- Exception process: Obtain explicit sign-off from the technical lead prior to introducing boundary-specific projection types.