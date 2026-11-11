---
version: 2
name: b4b8f962-a551-4260-afeb-f7b566c468ae-adoption-of-node-crypto-module-for-cryptographic-operations-and-identifier-generation-cryptographic-digest-comparisons-token-authentications-utilize
description: "Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Cryptographic Digest Comparisons Token Authentications Utilize"
metadata:
  actual:
    adr_id: b4b8f962-a551-4260-afeb-f7b566c468ae
    status: accepted
    candidate_group_id: 7d6316d2-f20d-4045-a245-65f14eccb677
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto Module for Cryptographic Operations and Identifier Generation: Cryptographic Digest Comparisons Token Authentications Utilize

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/**`

## Context

- Distributed execution, stateful session handling, notebook execution pipelines, and persistent entity storage require consistent generation of secure unique identifiers and cryptographic digests.
- The codebase standardizes on the runtime native cryptographic capabilities across all execution boundaries, avoiding fragmented third-party cryptographic utilities.
- The explicit protocol prefix specifier ensures unambiguous resolution of runtime core libraries and eliminates namespace collision risks against third-party packages.

## Problem Statement

Distributed server sessions, peer process execution lifecycles, and persistent storage layers require cryptographic hashing and cryptographically secure identifier generation. Utilizing disparate third-party libraries across subsystems introduces supply-chain risk, bundle bloat, and inconsistent random number generation semantics, while ambiguous module specifiers risk supply-chain namespace shadowing.

## Decision

1. SHOULD: Cryptographic digest comparisons and token authentications SHOULD utilize constant-time comparison functions from the node:crypto module to mitigate timing attack vulnerabilities.

## Policy Block

- SHOULD Cryptographic digest comparisons and token authentications SHOULD utilize constant-time comparison functions from the node:crypto module to mitigate timing attack vulnerabilities.

In scope:
- Modules requiring cryptographically secure unique identifiers, session keys, invocation tracking tokens, or entity identifiers
- Subsystems computing cryptographic hashes, integrity digests, or checksums
- Services requiring constant-time comparisons or cryptographic security boundaries

Out of scope:
- Non-cryptographic indexing or numerical counter incrementation where collision avoidance is managed by sequential database sequences
- User-facing vanity slugs or non-unique presentation labels

Exceptions:
- EXP-20-001: A specialized cryptographic algorithm is mathematically required by an external integration protocol that is not implemented in the native runtime module

## Rationale

- Native runtime module adoption eliminates supply-chain vulnerabilities, external maintenance latency, and licensing overhead associated with third-party cryptographic utility packages.
- The explicit protocol prefix import prevents dependency confusion and namespace shadowing attacks by guaranteeing resolution against the built-in runtime implementation.
- Consistent reliance on platform cryptographic primitives provides hardware-accelerated performance and constant-time execution characteristics critical for security-sensitive distributed systems.

## Consequences

Positive:
- Zero external package overhead for core cryptographic hashing and secure identifier generation across all services
- Deterministic module resolution immune to third-party package namespace collisions
- Standardized secure identifier generation across session management, process execution, and data persistence

Negative:
- Direct dependency on execution runtime platform version availability for specific cryptographic API methods
- Inability to substitute or polyfill cryptographic functions transparently across non-compliant runtime environments without architectural adapters

## Alternatives

- Adopting third-party packages for identifier and hash generation (rejected)
  Rejected because: Introduces unnecessary third-party dependency surface, supply-chain vulnerabilities, and divergent API conventions across modules
  When valid: Targeting legacy execution runtimes that lack native cryptographically secure identifier and modern digest APIs
- Unprefixed module imports for core runtime libraries (rejected)
  Rejected because: Leaves module resolution vulnerable to dependency confusion and namespace collisions with third-party packages
  When valid: Targeting obsolete runtimes that do not support explicit protocol scheme module specifiers

## Risks

- Runtime environment discrepancy causing missing cryptographic API methods across execution targets
  Mitigation: Enforce lock and resolution artifact inspection and runtime version validation during continuous integration.
  Owner: Engineering Team
- Developer adoption of non-cryptographic random generators for sensitive token creation
  Mitigation: Implement static analysis lint rules prohibiting non-cryptographic random utilities in identifier generation paths.
  Owner: Security Architecture Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- All imports of the core cryptographic module must use the explicit protocol prefix specifier in module declarations.
- Identifier generation for tracking runtime invocations, user sessions, and persistent entities should standardize on native secure identifier generation functions.

## Continuation Context


Verify commands:
- Discover and run the project static analysis and lint check scripts to verify all cryptographic imports use the explicit protocol prefix.
- Discover and run the test suite to validate that identifier generation and hashing functions execute correctly across all target environments.

Accept when:
- Static analysis reports zero unprefixed core cryptographic module imports across all source files.
- All unit and integration test suites pass without cryptographic primitive or resolution errors.

## Enforcement

- Verified by: Automated static analysis checks in the continuous integration pipeline
- Verified by: Peer code review verification of cryptographic imports and identifier generation calls
- Violation handling: Pull requests containing third-party cryptographic utilities or unprefixed core imports are blocked from merging until corrected.
- Exception process: Exceptions must be submitted via architectural review request documenting specific cryptographic constraints and security team approval.