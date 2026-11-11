---
version: 2
name: 38e8ba19-6ce5-4015-8f7d-eef7354fe984-persistence-core-module-adoption-domain-handlers-query-services-not-implement
description: "Persistence Core Module Adoption: Domain Handlers Query Services Not Implement"
metadata:
  actual:
    adr_id: 38e8ba19-6ce5-4015-8f7d-eef7354fe984
    status: accepted
    candidate_group_id: 05fe97e4-aac0-4400-bf57-9e0e81934dc9
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/references/**
      - src/sessions/**
---

# Persistence Core Module Adoption: Domain Handlers Query Services Not Implement

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/references/**`
- `src/sessions/**`

## Context

- Domain subsystems responsible for session restoration, thought queries, and anchor resolution require persistent state access and synchronization.
- Multiple independent domain services exhibited duplicate data handling requirements across session lifecycle events and reference lookups.
- A unified internal persistence module was introduced to centralize storage operations and decouple handlers from underlying datastores.

## Problem Statement

Direct, uncoordinated access to persistent state across session handling, query operations, and reference resolution creates data inconsistency, duplicates storage logic, and tightly couples domain handlers to storage mechanisms.

## Decision

1. MUST_NOT: Domain handlers and query services MUST NOT implement direct storage engine queries or access raw persistence backends bypassing the persistence module.

## Policy Block

- MUST_NOT Domain handlers and query services MUST NOT implement direct storage engine queries or access raw persistence backends bypassing the persistence module.

In scope:
- All domain services, session handlers, query abstractions, and reference resolvers performing state persistence or retrieval.

Out of scope:
- Stateless utility functions and pure input parsing components that do not manage or retrieve persisted records.

## Rationale

- Static analysis confirms that session handlers, thought queries, and reference anchor resolvers consistently import and interact with the centralized persistence module.
- Centralizing persistence operations into a dedicated module boundary prevents persistence logic leaks into application workflow handlers and allows query optimizations to remain isolated.
- Standardizing on a shared module interface enables uniform error handling, logging, and resolution caching across the codebase.

## Consequences

Positive:
- Enforces a uniform boundary for state access and mutations across session orchestration and reference resolution.
- Prevents schema drift and uncoordinated queries by encapsulating storage patterns within a designated internal core module.
- Facilitates consistent in-memory caching and resolution index population across domain consumers.

Negative:
- Domain services depend directly on the shared persistence module interface, requiring coordinated refactoring when persistent entities evolve.
- Centralized module boundary introduces an additional layer of abstraction that requires consistent mock and test fixtures in automated suites.

## Alternatives

- Direct Datastore Access in Domain Subsystems (rejected)
  Rejected because: Distributing raw storage queries across handlers and resolvers creates schema fragmentation, duplicates caching logic, and tightly couples domain logic to underlying datastores.
  When valid: Valid only in throwaway prototypes or isolated one-off scripts with no shared domain models.
- Independent Per-Subsystem Storage Engines (rejected)
  Rejected because: Introducing independent persistence layers for sessions and reference anchors creates data synchronization hazards and duplicate persistence logic.
  When valid: Valid when subsystems are decomposed into physically separated microservices with dedicated databases.

## Risks

- Interface changes in the persistence module could simultaneously break session handling, thought queries, and anchor resolution.
  Mitigation: Maintain strictly typed query and result contracts exported by the persistence module with comprehensive regression tests.
  Owner: engineering team
- Stale in-memory cache entries in resolvers or session handlers could diverge from the underlying persisted state.
  Mitigation: Establish explicit cache invalidation mechanisms and synchronization routines between resolution caches and stored records.
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
- Encapsulate complex state queries inside domain query objects that interact with the persistence module rather than inlining query logic into session handlers.
- Ensure caching structures such as resolution caches or anchor lookups invalidate properly upon state mutation through the persistence boundary.

## Continuation Context


Verify commands:
- Discover the repository test runner from the project manifest and execute the test suite covering domain handlers and persistence integration.
- Discover the repository static analysis linter and run import boundary checks to ensure domain handlers import persistence exclusively through the designated module contract.

Accept when:
- All session handling and reference resolution test suites pass against the centralized persistence module boundary.
- Static analysis confirms no domain modules execute unmediated datastore queries bypassing the persistence module interface.

## Enforcement

- Verified by: Automated linting and module boundary checks executed during continuous integration.
- Verified by: Architecture review and code reviews validating module import paths for stateful operations.
- Violation handling: Code submissions that bypass the persistence module boundary fail continuous integration checks.
- Violation handling: Reviewers block pull requests introducing unmediated datastore calls or duplicate storage interfaces.
- Exception process: Submit an architecture exception request detailing why direct persistence interaction or external storage integration is required.
- Exception process: Obtain sign-off from domain module owners before bypassing or extending the centralized persistence interface.