---
version: 2
name: e84d1f01-b24d-4f0f-9a5a-7b5e5cee04bc-adoption-of-node-crypto-for-native-cryptographic-operations-modules-requiring-cryptographic-hashing-random-token
description: "Adoption of node:crypto for Native Cryptographic Operations: Modules Requiring Cryptographic Hashing Random Token"
metadata:
  actual:
    adr_id: e84d1f01-b24d-4f0f-9a5a-7b5e5cee04bc
    status: accepted
    candidate_group_id: 83659c58-c187-4a51-b487-8cea96be5702
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of node:crypto for Native Cryptographic Operations: Modules Requiring Cryptographic Hashing Random Token

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/peer-notebook/**`

## Context

- The peer service architecture coordinates distributed workspace peers, tool manifests, invocation traces, and repository state across local and remote data stores.
- Cryptographic routines, secure token generation, and entity identification are required across routing brokers, repository caches, and persistence adapters.
- Third-party cryptographic dependencies introduce supply-chain exposure, dependency drift, and runtime packaging overhead.
- The runtime environment provides native cryptographic capabilities through its core module namespace, ensuring deterministic execution across all service components.

## Problem Statement

Decentralized peer runtime operations require uniform cryptographic operations, entity key generation, and data integrity verification across repository, broker, and persistence boundaries without incurring external dependency overhead or divergent cryptographic implementations.

## Decision

1. MUST: All modules requiring cryptographic hashing, random token generation, key derivation, or integrity validation MUST import and use the native node:crypto module.

## Policy Block

- MUST All modules requiring cryptographic hashing, random token generation, key derivation, or integrity validation MUST import and use the native node:crypto module.

In scope:
- All backend domain services, broker components, repository stores, and persistence adapters requiring cryptographic operations or secure identifier generation.

Out of scope:
- Client-side browser applications or external third-party integrations that manage independent transport-layer security or internal cryptographic sessions.

Exceptions:
- EXC-20-001: A specialized cryptographic algorithm or hardware-security-module protocol is required that is not supported by the native platform module.

## Rationale

- Adopting node:crypto across core domain services establishes a single, verified cryptographic provider without introducing external supply-chain dependencies.
- Core runtime module adoption minimizes maintenance overhead, reduces bundle sizes, and ensures consistent cryptographic behavior across broker dispatch and repository persistence layers.
- Protocol-prefixed module loading prevents ambiguous dependency resolution and guards against namespace typosquatting vulnerabilities.

## Consequences

Positive:
- Eliminates third-party supply-chain risks for core hashing and random number generation.
- Provides consistent cryptographic performance and native platform security hardening across repository and broker layers.
- Minimizes external dependency maintenance and prevents version conflicts across modular components.

Negative:
- Couples cryptographic operations to the runtime environment, requiring compatibility shims if ported to heterogeneous edge platforms.
- Requires engineers to configure cryptographic parameters and security lifecycles directly rather than consuming high-level opinionated abstractions.

## Alternatives

- Adopting third-party utility packages for hashing and unique identifier generation (rejected)
  Rejected because: Third-party packages introduce unnecessary supply-chain dependencies and maintenance overhead when the runtime platform natively provides equivalent cryptographic primitives.
  When valid: When targeting multi-runtime environments where platform core modules are unavailable.
- Using language built-in pseudo-random functions for identifier generation (rejected)
  Rejected because: Built-in pseudo-random functions lack the cryptographic entropy and collision resistance required for secure workspace entities and invocations.
  When valid: When generating non-sensitive visual layout keys or test mock data with no persistence.

## Risks

- Inconsistent usage of cryptographic algorithms across different subsystem repositories
  Mitigation: Establish shared utility wrappers or internal cryptographic conventions adhering strictly to the core module.
  Owner: Engineering Team
- API divergence across different runtime engine versions
  Mitigation: Enforce dependency manifest constraints and lock artifact verification during build and automated testing workflows.
  Owner: Architecture Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Locate all module import statements performing cryptographic operations or random identifier generation and align them to the standardized protocol-prefixed core library specifier.
- Audit repository key formatting, entity token creation, and broker routing digests to ensure uniform cryptographic entropy and deterministic hashing.

## Continuation Context


Verify commands:
- Discover the repository static analysis script from the project manifest and execute it to verify that all cryptographic imports conform to the protocol-prefixed core module specifier.
- Discover and run the project test suite to validate cryptographic operations, key generation routines, and broker dispatch integrity.

Accept when:
- Static analysis validates that all cryptographic imports use the protocol-prefixed core library specifier without third-party cryptographic utility dependencies.
- Automated test suites pass with all cryptographic hashing and token generation operations behaving deterministically across repository and broker layers.

## Enforcement

- Verified by: Automated static analysis checks configured in the continuous integration pipeline.
- Verified by: Peer code review mandatory for all changes touching security, broker routing, or repository persistence modules.
- Violation handling: Pull requests introducing unapproved third-party cryptographic dependencies or un-prefixed core module imports are blocked by automated status checks.
- Violation handling: Discovered violations must be refactored to use the native core module before merging.
- Exception process: Submit a formal exception request detailing the algorithmic or environmental requirement to the architecture review team.
- Exception process: Exceptions require approval from security leadership and must be recorded in the repository exception register.