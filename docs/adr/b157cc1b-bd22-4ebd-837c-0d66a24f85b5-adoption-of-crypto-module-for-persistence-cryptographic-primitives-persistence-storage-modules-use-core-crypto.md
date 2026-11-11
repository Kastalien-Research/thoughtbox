---
version: 2
name: b157cc1b-bd22-4ebd-837c-0d66a24f85b5-adoption-of-crypto-module-for-persistence-cryptographic-primitives-persistence-storage-modules-use-core-crypto
description: "Adoption of Crypto Module for Persistence Cryptographic Primitives: Persistence Storage Modules Use Core Crypto"
metadata:
  actual:
    adr_id: b157cc1b-bd22-4ebd-837c-0d66a24f85b5
    status: accepted
    candidate_group_id: ebcc38e4-6aa5-43a9-895f-87776cec82dc
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/persistence/**
---

# Adoption of Crypto Module for Persistence Cryptographic Primitives: Persistence Storage Modules Use Core Crypto

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/persistence/**`

## Context

- Storage and persistence implementations require deterministic cryptographic operations, unique token creation, and hash generation.
- Multiple persistence subsystems maintain in-memory indexing and filesystem storage structures that interact with session and node identifiers.
- Standardizing on the core crypto module ensures uniform cryptographic functionality without introducing external library dependencies.

## Problem Statement

Persistence components require consistent cryptographic operations and hash generation for data structures such as sessions, nodes, and revisions. Divergent cryptographic implementations or external utility packages across storage engines risk dependency bloat, inconsistent hashing behavior, and elevated maintenance overhead.

## Decision

1. MUST: Persistence and storage modules MUST use the core crypto module for all cryptographic operations, digest calculations, and cryptographically secure random identifier generation.

## Policy Block

- MUST Persistence and storage modules MUST use the core crypto module for all cryptographic operations, digest calculations, and cryptographically secure random identifier generation.

In scope:
- All persistence, indexing, and storage engine modules that perform cryptographic hashing, token creation, or identifier generation.

Out of scope:
- Client-side browser modules or external service integrations operating outside the core runtime environment.

## Rationale

- The core crypto module is already established across persistence subsystems for hashing and identifier management.
- Utilizing the built-in runtime module minimizes supply-chain risk and avoids introducing redundant external dependencies for standard cryptographic algorithms.
- Centralizing on core cryptographic primitives guarantees consistent data integrity checks between memory-indexed and filesystem-backed storage implementations.

## Consequences

Positive:
- Eliminates third-party dependency overhead for cryptographic operations in storage layers.
- Maintains uniform hash calculation and identifier generation across storage backends.
- Reduces supply-chain attack surface within persistence subsystems.

Negative:
- Ties cryptographic implementations to runtime platform availability and API conventions.
- Requires abstraction adapters if execution environments without native runtime crypto support are targeted in the future.

## Alternatives

- Adoption of third-party external cryptographic libraries (rejected)
  Rejected because: Introduces external supply chain dependencies and maintenance overhead when standard runtime cryptographic capabilities are already available.
  When valid: Valid only when specialized algorithms not present in the runtime core module are strictly required.
- Custom non-cryptographic hashing algorithms (rejected)
  Rejected because: Custom hashing routines carry higher collision risks and lack security guarantees for identifier generation and data integrity.
  When valid: Valid only in performance-critical non-security caching where collisions are explicitly handled.

## Risks

- Runtime environment differences may alter crypto API behavior across execution contexts.
  Mitigation: Enforce contract verification through unit and integration tests executing across target runtime configurations.
  Owner: Engineering Team
- Inappropriate algorithm selection within crypto could lead to insecure hash generation.
  Mitigation: Enforce code review guidelines and static analysis rules to restrict algorithm parameters to standardized secure algorithms.
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
- Encapsulate cryptographic hashing and random identifier generation in persistence utility interfaces to decouple storage logic from runtime module signatures.
- Verify that all cryptographic methods utilized in storage engines operate synchronously or asynchronously according to the data access pattern of the calling component.

## Continuation Context


Verify commands:
- Discover the test runner from the project repository configuration and execute the test suite covering persistence and storage modules.
- Discover the static analysis configuration and run dependency validation to confirm no unauthorized third-party cryptographic packages are imported in storage layers.

Accept when:
- All persistence and storage test suites pass with zero cryptographic or identifier generation failures.
- Static analysis confirms storage modules reference exclusively the core crypto module for cryptographic operations.

## Enforcement

- Verified by: Automated continuous integration pipeline running test suites and static analysis linters.
- Verified by: Peer code review gating all modifications to storage and persistence layers.
- Violation handling: Pull requests introducing external cryptographic libraries or unapproved hashing patterns into storage modules are blocked from merging.
- Exception process: Exceptions require approval from the technical lead following an architecture review demonstrating why runtime core crypto capabilities are insufficient.