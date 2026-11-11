---
version: 2
name: 89f8afd9-afe6-4ad1-baef-1b0fc8b8baff-adoption-of-node-crypto-for-core-cryptographic-primitives-components-encapsulate-repetitive-cryptographic-hashing-patterns
description: "Adoption of node:crypto for Core Cryptographic Primitives: Components Encapsulate Repetitive Cryptographic Hashing Patterns"
metadata:
  actual:
    adr_id: 89f8afd9-afe6-4ad1-baef-1b0fc8b8baff
    status: accepted
    candidate_group_id: 2e5354bd-d96c-4b7a-ae27-4faea2ca97f6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of node:crypto for Core Cryptographic Primitives: Components Encapsulate Repetitive Cryptographic Hashing Patterns

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/**`

## Context

- Cryptographic services, hashing routines, and unique identifier generation are required across distributed hub consensus, peer execution runtimes, task stores, and repository storage modules.
- Multiple subsystem boundaries exchange serialized manifests and state records requiring deterministic hashing and digest verification.
- Utilizing platform core modules prevents introducing unnecessary third-party package dependencies for standard cryptographic operations.

## Problem Statement

Distributed hub consensus, peer notebook invocation, task persistence, and entity storage components require cryptographic operations including hashing, identity generation, and payload validation. Without a uniform architectural decision on cryptographic module adoption, modules risk fragmenting across disparate third-party cryptographic utilities or inconsistent platform-specific imports, introducing supply-chain exposure and behavioral variance.

## Decision

1. MAY: Components MAY encapsulate repetitive cryptographic hashing patterns behind domain-specific internal utility abstractions provided the underlying implementation delegates to node:crypto.

## Policy Block

- MAY Components MAY encapsulate repetitive cryptographic hashing patterns behind domain-specific internal utility abstractions provided the underlying implementation delegates to node:crypto.

In scope:
- All application modules, runtime providers, consensus handlers, repository layers, and protocol services requiring cryptographic hashing, message digests, or secure identifier generation.

Out of scope:
- Non-cryptographic string manipulations, pseudo-random operations where cryptographic security is explicitly not required, and external client integrations that require specialized protocol-mandated wire formats.

## Rationale

- Static analysis across twenty-eight files confirms uniform adoption of node:crypto for digest generation, entity identification, and consensus state hashing across all functional boundaries.
- Adopting the platform core module eliminates third-party supply-chain exposure and binary compilation friction associated with external cryptographic libraries.
- The protocol scheme prefix node:crypto enforces deterministic module resolution and prevents namespace confusion with external package registries.

## Consequences

Positive:
- Eliminates external supply-chain dependencies and vulnerabilities for standard cryptographic algorithms and random number generation.
- Ensures consistent cryptographic behavior and deterministic hashing across all runtime components and storage layers.
- Reduces total bundle size and build complexity by relying on platform-native core runtime capabilities.

Negative:
- Direct consumption of core runtime cryptographic primitives couples codebase execution to platform environments providing compatible native crypto interfaces.
- Cryptographic API surface evolution across platform releases requires maintenance of internal hashing and identity helpers.

## Alternatives

- Adoption of third-party userland cryptographic utility libraries (rejected)
  Rejected because: Introduces external supply-chain attack vectors, increased bundle weight, and duplicate cryptographic implementations already present in the runtime platform.
  When valid: When targeting runtime environments lacking native core crypto modules or requiring proprietary algorithm suites not supported by standard platform engines.
- Bare specifier crypto imports without the protocol scheme prefix (rejected)
  Rejected because: Subject to package shadowing risks and ambiguous resolution between local packages and platform core modules.
  When valid: When constrained by legacy module bundlers that do not support standard protocol-prefixed core specifiers.

## Risks

- Platform runtime divergence if running in alternative environments where core cryptographic APIs differ in availability or signature.
  Mitigation: Validate environment compatibility during automated verification suites and encapsulate platform-specific calls within internal interface boundaries.
  Owner: Engineering Team
- Inadvertent use of deprecated or non-constant-time cryptographic methods for security-critical validation.
  Mitigation: Enforce static analysis rules and peer review checkpoints verifying adherence to secure hashing and timing-safe functions.
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
- Ensure all import declarations targeting cryptographic capabilities explicitly specify the core module protocol scheme prefix.
- Prefer asynchronous or stream-based hashing utilities when processing large payloads or state transfers to prevent blocking the primary runtime event loop.

## Continuation Context


Verify commands:
- Discover the project static analysis and linting scripts from the manifest and execute them to verify that all cryptographic module imports use the explicit protocol scheme prefix.
- Discover and run the project test execution suites to verify that cryptographic digests, entity identifiers, and consensus hashes produce expected deterministic values across all test cases.

Accept when:
- Static analysis reports zero non-prefixed or third-party cryptographic module imports across all governed packages.
- All automated test suites pass with deterministic cryptographic outputs and no runtime initialization errors.

## Enforcement

- Verified by: Automated linting and static analysis rules executed during continuous integration pipelines.
- Verified by: Pull request architectural code reviews evaluating module import specifiers and cryptographic utility usage.
- Violation handling: Continuous integration builds fail upon detection of disallowed third-party crypto dependencies or non-prefixed import specifiers.
- Violation handling: Violating pull requests require remediation before approval and merge.
- Exception process: Submit an architectural review proposal justifying algorithm requirements that cannot be satisfied by the platform core module, accompanied by security lead approval.