---
version: 2
name: d92da9d6-2b6b-4cd8-8473-827fc1f83743-adoption-of-lib-types-api-keys-for-shared-domain-type-definitions-module-implementations-not-define-hoc-duplicate
description: "Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Module Implementations Not Define Hoc Duplicate"
metadata:
  actual:
    adr_id: d92da9d6-2b6b-4cd8-8473-827fc1f83743
    status: accepted
    candidate_group_id: c5457ac3-7f2b-45b7-a133-b910591980d7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/types/api-keys` for Shared Domain Type Definitions: Module Implementations Not Define Hoc Duplicate

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`

## Context

- Server-side mutation procedures handle workspace API key lifecycle events including generation, credential hashing, and cache revalidation.
- Client-side data presentation components render workspace API key metadata and manage interactive user interface states.
- Cross-boundary communication between server actions and client table components requires consistent domain entity typing without introducing runtime circular dependencies.
- The project routes credential domain models through an internal module to standardize API key entity representations across rendering environments.

## Problem Statement

Without a centralized domain type contract, client-side rendering components and server-side credential mutation handlers risk structural divergence in API key data structures, leading to runtime data handling mismatches and duplicated interface declarations across application boundaries.

## Decision

1. MUST_NOT: Module implementations MUST NOT define ad-hoc or duplicate local type definitions for API key entities across server and client boundaries.

## Policy Block

- MUST_NOT Module implementations MUST NOT define ad-hoc or duplicate local type definitions for API key entities across server and client boundaries.

In scope:
- All server-side actions, mutations, and handlers operating on workspace API keys
- All client-side components and data tables displaying or modifying workspace API keys

Out of scope:
- Independent service domains unrelated to workspace credential and API key management
- Generic utility modules that operate on arbitrary primitive types without domain context

## Rationale

- Centralizing API key type definitions in a dedicated internal module guarantees structural synchronization across server-side hashing actions and client-side table displays.
- Static type sharing eliminates redundant type declarations across rendering boundaries while preventing subtle drift in credential representation.
- Isolating domain types from persistence or UI implementations allows both client components and server actions to depend on pure contracts without triggering unwanted bundle leakage.

## Consequences

Positive:
- Guarantees unified domain data contracts across asynchronous server actions and client interactive tables.
- Prevents interface drift when modifying credential metadata or domain field requirements.
- Improves developer productivity by offering a single authoritative source for credential type structures.

Negative:
- Creates a centralized coupling point where modifications in the shared type contract require synchronized updates across both server and client consumers.
- Requires discipline to ensure the shared type module remains strictly free of server-only or client-only runtime side effects.

## Alternatives

- Ad-hoc inline interface declarations within individual client components and server actions (rejected)
  Rejected because: Increases risk of silent schema divergence and contract mismatch between server mutations and presentation views.
  When valid: Isolated prototype scripts with no cross-boundary data transfer.
- Deriving client interfaces directly from server persistence database client schemas (rejected)
  Rejected because: Risks leaking sensitive server-side database schemas and credential hash fields into client-facing component contracts.
  When valid: Internal administrative tooling where raw database schemas map directly to views without security transformations.

## Risks

- Accidental introduction of server-only or client-only runtime imports into the shared types module causing bundle breakage.
  Mitigation: Enforce pure type exports in the shared module and verify boundaries via automated static analysis checks.
  Owner: Engineering Team
- Breaking changes in shared API key types causing synchronized compile failures across multiple consumer files.
  Mitigation: Version internal contract interfaces incrementally and validate all consuming boundaries in continuous integration builds.
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
- Verify that all exported structures in the shared type module contain only pure type declarations and no runtime executable side effects.
- When adding new attributes to API key records, update the shared type module first and ensure both mutation handlers and display tables satisfy the updated contract.

## Continuation Context


Verify commands:
- Discover the project verification script from the repository manifest and execute type checking across all workspace packages.
- Run the project's static analysis and linting scripts to verify import boundary compliance for shared type modules.

Accept when:
- All consuming server actions and client presentation components compile against the shared type module without type errors.
- No local duplicate type declarations exist for API key entities across client presentation or server action boundaries.
- The shared type module exports exclusively type declarations without pulling runtime dependencies into client bundles.

## Enforcement

- Verified by: Automated continuous integration type checking and boundary linting runs on all pull requests.
- Verified by: Peer code review verification confirming shared type adoption across new or modified API key features.
- Violation handling: Pull requests containing duplicate API key interfaces or cross-boundary contract mismatches are blocked from merging.
- Violation handling: Violating code must be refactored to consume the shared type definitions before approval.
- Exception process: Exceptions require written approval from the principal engineering team and documented justification in the repository architectural log.