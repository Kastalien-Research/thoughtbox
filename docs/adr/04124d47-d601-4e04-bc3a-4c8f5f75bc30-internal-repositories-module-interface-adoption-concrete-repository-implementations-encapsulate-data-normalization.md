---
version: 2
name: 04124d47-d601-4e04-bc3a-4c8f5f75bc30-internal-repositories-module-interface-adoption-concrete-repository-implementations-encapsulate-data-normalization
description: "Internal Repositories Module Interface Adoption: Concrete Repository Implementations Encapsulate Data Normalization"
metadata:
  actual:
    adr_id: 04124d47-d601-4e04-bc3a-4c8f5f75bc30
    status: accepted
    candidate_group_id: 22f497ff-d640-47c0-85aa-09cd403c0993
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Internal Repositories Module Interface Adoption: Concrete Repository Implementations Encapsulate Data Normalization

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/peer-notebook/**`

## Context

- Subsystem components coordinating peer operations, tool dispatches, and broker mediation require structured access to persistent records and metadata.
- Direct database client invocation inside orchestration and broker proxy layers couples service routing to infrastructure-specific SDKs and storage implementations.
- A dedicated internal repositories module serves as the centralized contract defining data access abstractions across mediation and persistence boundaries.
- Multiple subsystem components import the shared repositories module interface to isolate storage implementations from broker execution logic.

## Problem Statement

Broker coordination and mediation proxy services require access to persistence mechanisms without coupling directly to underlying database client libraries, connection configurations, or protocol-specific storage implementations. Without a standardized internal module interface, data persistence logic, credential handling, and query execution risk leaking into broker coordination components, hindering modularity and testing.

## Decision

1. SHOULD: Concrete repository implementations SHOULD encapsulate data normalization, credential injection, session configuration, and storage-specific error handling behind the repositories module interfaces.

## Policy Block

- SHOULD Concrete repository implementations SHOULD encapsulate data normalization, credential injection, session configuration, and storage-specific error handling behind the repositories module interfaces.

In scope:
- Subsystem components performing data storage, peer lookup, broker dispatch, and proxy routing.
- Implementations of data persistence adapters and storage client wrappers.

Out of scope:
- Pure utility modules performing synchronous schema transformations or cryptographic operations.
- External consumer interfaces operating outside the internal broker boundary.

Exceptions:
- EXC-20-001: Diagnostic or administrative scripts require isolated, direct database connectivity bypassing broker coordination.

## Rationale

- Centering data access contracts on the internal repositories module decouples broker orchestration and proxy logic from concrete database client libraries.
- Codebase evidence across repository implementations, broker mediation, and proxy components demonstrates uniform reliance on the shared repositories module contract.
- Encapsulating persistence operations enables safe evolution of storage backends, caching strategies, and security validation without refactoring broker dispatch pathways.

## Consequences

Positive:
- Isolates broker coordination and proxy dispatch logic from concrete storage SDKs and connection management.
- Enables independent substitution of persistence layers and creation of mock adapters for testing.
- Establishes a single authoritative architectural boundary for data access operations across peer mediation components.

Negative:
- Introduces an additional abstraction layer requiring maintenance of shared contract interfaces alongside concrete adapters.
- Requires mapping domain entities and error conditions across repository contract boundaries.

## Alternatives

- Direct database client invocation in broker and proxy components (rejected)
  Rejected because: Couples orchestration components tightly to specific database SDKs and leaks credentials across boundaries
  When valid: Single-file prototype environments where modular separation is unnecessary
- Distributed microservice RPC calls for all data persistence interactions (rejected)
  Rejected because: Introduces significant network latency and operational complexity for in-process peer operations
  When valid: Multi-tenant architectures requiring strict physical service boundaries

## Risks

- Interface bloat or drift in the internal repositories module over time.
  Mitigation: Enforce lean, cohesive repository interfaces aligned with specific domain capabilities through regular interface audits.
  Owner: Subsystem engineering team
- Mismatched behavior or contract non-compliance across different repository adapter implementations.
  Mitigation: Maintain contract test suites that execute identically against all conforming repository implementations.
  Owner: Subsystem engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Locate the internal repositories module within the project directory structure to review exposed interfaces and types before implementing new storage adapters or broker consumers.
- Ensure concrete storage adapter implementations cleanly separate connection initialization, credential ingestion, and payload parsing from contract method signatures.

## Continuation Context


Verify commands:
- Discover and run the project type-checking script from the repository configuration to ensure all repository consumers and implementations adhere strictly to the shared module contract.
- Discover and execute the project automated test runner to validate contract compliance across all repository adapter implementations.
- Inspect dependency manifests and imports to verify no forbidden direct database client imports exist within broker orchestration components.

Accept when:
- The project type-checking validation completes with zero type errors across repository consumers and adapter implementations.
- All unit and contract tests verifying repository operations pass without failure.
- Architecture boundary verification confirms broker and proxy components access storage exclusively via the internal repositories module.

## Enforcement

- Verified by: Automated continuous integration pipeline executing repository contract tests and static type verification.
- Verified by: Peer code review auditing module import boundaries during pull request evaluation.
- Violation handling: Pull requests introducing direct database client imports in broker or proxy components are blocked until refactored behind repository interfaces.
- Violation handling: Build failures triggered by type discrepancies or contract test failures halt deployment pipelines.
- Exception process: Submit an architectural review request outlining technical constraints necessitating a direct bypass, requiring formal sign-off from the subsystem architecture lead.