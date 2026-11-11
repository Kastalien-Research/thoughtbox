---
version: 2
name: 5cdb72a6-5990-4367-be67-85a7696ae1e1-collocated-domain-types-modules-for-contract-isolation-types-modules-not-contain-runtime-business
description: "Collocated Domain Types Modules for Contract Isolation: Types Modules Not Contain Runtime Business"
metadata:
  actual:
    adr_id: 5cdb72a6-5990-4367-be67-85a7696ae1e1
    status: accepted
    candidate_group_id: 6fb76454-77db-42d4-a2b7-888812dd2ae0
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Collocated Domain Types Modules for Contract Isolation: Types Modules Not Contain Runtime Business

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/**`

## Context

- Subsystems throughout the codebase require shared definitions for domain entities, payload shapes, runtime state, and storage records.
- Multiple persistence adapters such as in-memory storage, relational engines, and cloud data clients operate against identical domain entities.
- Fifty-two files across core subsystems consistently isolate data contracts into dedicated collocated types modules to establish clean boundary specifications.

## Problem Statement

Defining domain interfaces, payload shapes, and storage contracts directly within operational service or persistence modules creates circular dependencies and tight coupling, preventing interchangeability of storage backends and obscuring boundary contracts.

## Decision

1. MUST_NOT: Types modules MUST NOT contain runtime business logic, network communication handlers, or side-effecting initialization code.

## Policy Block

- MUST_NOT Types modules MUST NOT contain runtime business logic, network communication handlers, or side-effecting initialization code.

In scope:
- All domain subsystems, repositories, storage backends, protocol handlers, and validation modules.
- All cross-subsystem interface definitions and shared data contracts.

Out of scope:
- Single-file utility functions with strictly internal, non-exported helper structures.
- Configuration scripts operating outside domain business logic boundaries.

## Rationale

- Centralizing domain contracts in dedicated types modules provides a single source of truth for entity shapes across heterogeneous implementations.
- Pure contract modules prevent runtime side effects and circular dependency graphs between consuming layers and storage adapters.
- The pattern is substantiated by fifty-two files across all major functional areas uniformly referencing dedicated internal types modules.

## Consequences

Positive:
- Decouples domain data models and contract specifications from runtime storage adapters and service logic.
- Eliminates circular dependency cycles between consumers, protocol handlers, and polymorphic persistence layers.
- Enables pluggable backend implementations against unified, centrally declared domain interfaces.

Negative:
- Adds modular overhead by requiring updates to both contract modules and implementation files when domain models evolve.
- Requires disciplined export management to prevent leaking internal subsystem types into public surface contracts.

## Alternatives

- Inline interface definitions within service and storage implementation modules (rejected)
  Rejected because: Couples data contracts directly to concrete runtime logic and creates circular dependencies when multiple implementations or consumers reference the same structures.
  When valid: Single-file utility modules that declare private, non-exported data structures with no cross-module consumers.
- Global ambient type declarations spanning the entire repository (rejected)
  Rejected because: Obscures module boundaries, impedes modular refactoring, and risks naming collisions across disparate domain subsystems.
  When valid: Universal runtime primitive extensions or global environment polyfills.

## Risks

- Accidental addition of runtime side effects or implementation imports into contract modules causing dependency loops.
  Mitigation: Enforce automated dependency linting to prohibit importing implementation modules into types modules.
  Owner: engineering team
- Divergence between static domain types and runtime validation schemas.
  Mitigation: Derive compile-time types from runtime schema definitions where schemas exist to ensure bidirectional consistency.
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
- Declare pure data interfaces, enumerations, and type aliases within the domain types module without importing runtime operational modules.
- When exposing runtime validation schemas alongside static types, derive static types directly from schema definitions to maintain synchronization without duplicate declarations.

## Continuation Context


Verify commands:
- Discover and execute the repository type-checking and linting suites configured in the build manifest to verify all exported interfaces and module imports resolve cleanly.
- Discover the static analysis validation script from repository configuration and run it to verify that domain type definitions remain confined to dedicated contract modules without circular dependencies.

Accept when:
- The discovered repository type-checking suite exits with code zero across all subsystem packages.
- Static analysis confirms that domain interfaces and data models are defined within dedicated types modules and consumed without circular dependencies.

## Enforcement

- Verified by: Automated static analysis and type checking executing within continuous integration pipelines.
- Verified by: Peer code review verification against module boundary guidelines.
- Violation handling: Pull requests introducing domain contract definitions inside implementation files or creating circular module imports will fail continuous integration checks.
- Violation handling: Violating definitions must be refactored into the appropriate domain types module before merge approval.
- Exception process: Submit an architecture review request justifying why inline contract definitions are required for a specific isolated component.
- Exception process: Document the exception rationale within the component documentation and establish automated checks ensuring no cross-file imports of the inline contract.