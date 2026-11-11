---
version: 2
name: 88e9867b-86cf-4006-949a-07da6775736f-adoption-of-revision-index-internal-module-for-storage-revision-indexing-persistence-implementations-managing-thought-hierarchies-coordinate
description: "Adoption of revision-index Internal Module for Storage Revision Indexing: Persistence Implementations Managing Thought Hierarchies Coordinate"
metadata:
  actual:
    adr_id: 88e9867b-86cf-4006-949a-07da6775736f
    status: accepted
    candidate_group_id: 86b6050c-f4b6-4e1c-b895-cf9acb476434
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of revision-index Internal Module for Storage Revision Indexing: Persistence Implementations Managing Thought Hierarchies Coordinate

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/persistence/**`

## Context

- Multiple persistence implementations require consistent tracking of thought node revisions and relationship indexes across disparate backend mechanisms.
- Thought tree structures require indexed lookups by thought sequence numbers and node identifiers to support lineage queries and revision navigation.
- Divergent revision-indexing logic between local memory stores and remote database storage engines creates state inconsistencies and code duplication.
- Centralizing indexing structures into a dedicated internal revision-index module establishes uniform revision-lookup capabilities across all storage boundaries.

## Problem Statement

Storage engines that persist structured thought graph nodes must maintain indices mapping thought sequence numbers to revised nodes and manage branch revisions without duplicating indexing logic across backend drivers.

## Decision

1. MUST: All persistence implementations managing thought hierarchies MUST coordinate revision indexing through the shared internal revision-index module.

## Policy Block

- MUST All persistence implementations managing thought hierarchies MUST coordinate revision indexing through the shared internal revision-index module.

In scope:
- Storage engine adapters and persistence drivers managing node histories and thought hierarchies.
- Subsystems requiring revision lookup, thought number resolution, and branch node index tracking.

Out of scope:
- Ephemeral user session state caches that do not participate in revision tracking.
- Presentation and transport layers operating strictly on finalized response representations.

## Rationale

- Evidence across persistence implementations demonstrates consistent reliance on revisionIndex.get and revision tracking structures to coordinate graph nodes.
- Reusing a single internal revision-index module guarantees that in-memory storage drivers and remote database adapters compute thought revision chains identically.
- Centralized index mutation and deletion patterns prevent synchronization drift and memory leaks across disparate storage drivers.

## Consequences

Positive:
- Guarantees deterministic thought sequence revision resolution regardless of the active persistence backend.
- Eliminates duplicated indexing and cache management code between in-memory testing engines and remote database implementations.
- Enforces predictable index cleanup during node removal operations across all storage providers.

Negative:
- Introduces shared coupling between storage drivers and the internal revision-index module contract.
- Requires remote database storage drivers to maintain in-memory indexing mirrors alongside remote query clients.

## Alternatives

- Independent Database-Native Revision Querying (rejected)
  Rejected because: Delegating revision resolution entirely to database-specific queries causes behavioral divergence between in-memory drivers and remote persistence drivers.
  When valid: When storage backends enforce transactional constraints natively through complex recursive queries and in-memory execution is not supported.
- Ad-Hoc Index Map Structures in Each Storage Driver (rejected)
  Rejected because: Duplicating index map declarations and lookup routines across drivers increases maintenance overhead and leads to inconsistent index deletion behavior.
  When valid: When different storage backends operate on incompatible node schema definitions with disjoint indexing requirements.

## Risks

- Memory consumption growth if large thought trees retain historical revision nodes without eviction in long-lived sessions
  Mitigation: Enforce explicit index deletion routines across storage adapters whenever sessions or nodes are terminated
  Owner: Persistence Engineering Team
- Contract instability in the internal revision-index module breaking downstream persistence adapters
  Mitigation: Define strict interface contracts using shared domain type definitions and automated contract compatibility validation
  Owner: Persistence Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Initialize revision index structures alongside node caches within storage adapter constructors or factory functions.
- Ensure that every delete operation against node collections coordinates with corresponding deletion invocations against revision indices.

## Continuation Context


Verify commands:
- Discover the project test runner from the dependency manifest and execute all persistence unit and integration test suites.
- Discover the project static analysis and linting scripts from the root configuration and verify module boundary compliance across persistence drivers.

Accept when:
- All persistence adapter test suites verify identical revision resolution behavior using revisionIndex.get across in-memory and database-backed drivers.
- Static module dependency analysis confirms all storage drivers import revision indexing capabilities exclusively from the revision-index module.

## Enforcement

- Verified by: Continuous integration test execution of persistence unit and integration suites.
- Verified by: Automated architecture and module boundary static analysis checks.
- Verified by: Peer code review for all modifications touching storage drivers or indexing modules.
- Violation handling: Pull requests introducing independent revision mapping structures in storage drivers will be rejected.
- Violation handling: Static analysis violations reporting improper persistence module coupling fail automated build gates.
- Exception process: Architectural exceptions require approval from the persistence lead and a documented transition strategy.