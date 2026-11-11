---
version: 2
name: fc55f7ac-f903-4a38-ab16-dc5b1d43cd4b-standardization-on-node-crypto-for-native-cryptographic-operations-and-hashing-consumers-inspect-repository-dependency-manifest-lock
description: "Standardization on node:crypto for Native Cryptographic Operations and Hashing: Consumers Inspect Repository Dependency Manifest Lock"
metadata:
  actual:
    adr_id: fc55f7ac-f903-4a38-ab16-dc5b1d43cd4b
    status: accepted
    candidate_group_id: 76d85310-8fcf-4be4-859b-176d3ee23c07
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - .claude/hooks/**
      - src/lib/api-keys/**
---

# Standardization on node:crypto for Native Cryptographic Operations and Hashing: Consumers Inspect Repository Dependency Manifest Lock

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `.claude/hooks/**`
- `src/lib/api-keys/**`

## Context

- The system requires secure generation of API keys and consistent calculation of cryptographic content digests across application services and operational hooks.
- Introducing third-party userland cryptographic packages increases supply-chain attack surface and maintenance overhead for primitives that runtime environments natively supply.
- Static analysis observes explicit adoption of node:crypto and crypto.createHash for key generation and data hashing without auxiliary external dependencies.

## Problem Statement

Cryptographic operations such as API token generation and content hashing can easily become fragmented across disparate third-party libraries or inconsistent platform APIs, creating maintenance burden and security exposure. An architectural standard is required to establish whether cryptographic operations must rely on built-in runtime modules or external dependencies.

## Decision

1. MUST: Consumers MUST inspect the repository dependency manifest and lock artifact to verify the environment runtime baseline and guarantee compatibility with required cryptographic APIs before introducing code dependent on versioned runtime features.

## Policy Block

- MUST Consumers MUST inspect the repository dependency manifest and lock artifact to verify the environment runtime baseline and guarantee compatibility with required cryptographic APIs before introducing code dependent on versioned runtime features.

In scope:
- Server-side application library modules handling token, secret, or API key generation.
- Automation hooks, tooling bridges, and internal runtime scripts computing cryptographic hashes or digests.

Out of scope:
- Client-side browser applications that execute outside server runtime environments and lack access to the core runtime module namespace.
- Non-cryptographic string manipulation and basic data encoding routines that do not require cryptographic security properties.

## Rationale

- Static analysis confirms that key generation and automation bridge components directly import node:crypto and invoke crypto.createHash for data digests.
- Standardizing on the native runtime module eliminates external dependency bloat and reduces supply-chain vulnerability risks for security-sensitive cryptographic routines.
- Explicit protocol-prefixed module specifiers clarify execution boundaries and prevent accidental resolution hijacking by external userland packages.

## Consequences

Positive:
- Zero external dependency footprint for foundational hashing and cryptographic token creation.
- Consistent cryptographic behavior and algorithm parameters across application libraries and developer workflow bridges.
- Reduced exposure to third-party package vulnerabilities and maintenance churn.

Negative:
- Server-side cryptographic routines are coupled to runtimes that implement the standard core runtime module specification.
- Shared logic between server runtimes and client browser environments requires platform-specific shims or architectural abstraction layers.

## Alternatives

- Adopt external userland cryptographic packages from a registry (rejected)
  Rejected because: External packages expand supply-chain risk and duplicate capabilities already maintained within the core runtime platform
  When valid: When targeting constrained multi-platform environments where runtime core modules are unavailable
- Standardize on native universal Web Crypto interfaces across all contexts (deferred)
  Rejected because: The codebase evidence establishes existing adoption of node:crypto for server-side utilities and automated execution hooks
  When valid: When universal isomorphic execution across browser and server contexts becomes a mandatory cross-cutting requirement

## Risks

- Inadvertent execution of server-specific cryptographic modules within client-side browser bundles causing bundle failure
  Mitigation: Enforce module boundary separation via static analysis checks and packaging configuration preventing core runtime module inclusion in client bundles
  Owner: engineering team
- Use of deprecated or weak hash algorithm specifiers within cryptographic digest calls
  Mitigation: Establish code review policies and static lint rules restricting algorithm arguments to approved secure standards
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
- Standardize cryptographic digest generation by invoking crypto.createHash with consistent encoding formats across all service utilities.
- Ensure module import declarations uniformly adopt the protocol-prefixed namespace rather than legacy un-prefixed identifiers to prevent namespace ambiguity.

## Continuation Context


Verify commands:
- Discover the repository static analysis script from the dependency manifest and execute it to verify imports match the core runtime module namespace.
- Locate and run the test suite defined in the build configuration to verify cryptographic hash outputs and token generation behavior.

Accept when:
- All imports for cryptographic hashing and key generation resolve to the core runtime module namespace with zero external library substitutions.
- Automated test suites and static analysis checks pass with zero diagnostic warnings or unresolved module specifiers.

## Enforcement

- Verified by: Automated static analysis checks in continuous integration pipelines detecting unapproved cryptographic package imports.
- Verified by: Peer code review verifying adherence to protocol-prefixed module imports and approved cryptographic primitives.
- Violation handling: Pull requests introducing unvetted external cryptographic packages or legacy un-prefixed module specifiers are blocked until corrected.
- Exception process: Exceptions for specialized cryptographic algorithms absent from the core runtime module require security review approval and formal architectural documentation.