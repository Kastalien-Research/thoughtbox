---
version: 2
name: 8f4e5fb3-f5e2-40b8-af2f-451f11cac134-adoption-of-modelcontextprotocol-sdk-authentication-subsystem-for-oauth-infrastructure-cryptographic-operations-supporting-140282591045d444
description: "Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Cryptographic Operations Supporting Authorization Redirects State"
metadata:
  actual:
    adr_id: 8f4e5fb3-f5e2-40b8-af2f-451f11cac134
    status: accepted
    candidate_group_id: 092812f4-1d5d-45f1-8d9c-a9b72e9dbaf9
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Adoption of @modelcontextprotocol/sdk Authentication Subsystem for OAuth Infrastructure: Cryptographic Operations Supporting Authorization Redirects State

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/auth/oauth/**`

## Context

- The application provides server-side authorization and client registration capabilities within a Model Context Protocol server environment.
- Static analysis reveals coordinated usage of `@modelcontextprotocol/sdk` authentication modules across provider and client storage components.
- A standardized approach to OAuth client resolution and authorization redirect handling is required across authentication endpoints.

## Problem Statement

Managing OAuth authorization flows and client metadata across protocol server boundaries requires consistent, compliant protocol primitives. Divergent implementations introduce security vulnerabilities and interoperability failures with Model Context Protocol clients.

## Decision

1. MUST: Cryptographic operations supporting authorization redirects and state parameters MUST utilize secure hashing and cryptographically strong pseudo-random number generation.

## Policy Block

- MUST Cryptographic operations supporting authorization redirects and state parameters MUST utilize secure hashing and cryptographically strong pseudo-random number generation.

In scope:
- All modules implementing OAuth server capabilities, client registration, or authorization flow handlers for the protocol server.
- Client storage and retrieval adapters serving authorization flows.

Out of scope:
- Internal utility scripts unrelated to authentication or authorization.
- Third-party external webhook handlers not governed by protocol client authorization contracts.

## Rationale

- Adopting `@modelcontextprotocol/sdk` authentication modules aligns the authorization server directly with specification standards for protocol clients.
- Evidence confirms existing integration across both provider workflows and client storage layers, demonstrating established architectural dependency.
- Abstracting client persistence behind standardized SDK contracts allows flexible backing storage while maintaining protocol compatibility.

## Consequences

Positive:
- Ensures standard compliance with Model Context Protocol specification for client discovery and authentication.
- Reduces implementation errors in authorization code generation, state verification, and client validation.
- Provides consistent interfaces for integrating diverse persistence tiers behind unified client contracts.

Negative:
- Tight coupling to upstream `@modelcontextprotocol/sdk` authentication interface changes across version updates.
- Requires custom storage backends to continuously conform to SDK client contract interfaces.

## Alternatives

- Custom proprietary OAuth 2.0 authorization implementation (rejected)
  Rejected because: Introduces high maintenance overhead, increases vulnerability risk, and deviates from standardized Model Context Protocol authentication contracts.
  When valid: Valid only when building standalone non-protocol services that do not interface with Model Context Protocol clients.
- Generic third-party OAuth provider library without protocol integration (rejected)
  Rejected because: Lacks native typing and lifecycle contracts specifically defined by the Model Context Protocol ecosystem, requiring bespoke translation layers.
  When valid: Valid when authenticating external web clients outside the scope of protocol server sessions.

## Risks

- Breaking interface changes in upstream protocol SDK releases could disrupt authorization workflows.
  Mitigation: Follow lock-version grounding procedures before upgrades and maintain integration tests validating client and provider contracts.
  Owner: engineering team
- In-memory client caching out of synchronization with backing persistent storage during client revocation.
  Mitigation: Ensure in-memory client caches maintain cache-invalidation or short time-to-live policies aligned with persistent storage.
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
- Implement client storage adapters by encapsulating persistence engine calls behind the protocol SDK client management interfaces.
- Ensure cryptographic state tokens and authorization codes use cryptographically strong generation and hashing primitives.

## Continuation Context


Verify commands:
- Discover and run the project's dependency validation script to confirm lock artifact integrity and protocol SDK resolution.
- Discover and run the project's test suite covering authentication provider flows and client storage contracts.
- Discover and run the static type checker to verify compliance with protocol SDK authentication interfaces.

Accept when:
- All authentication unit and integration test suites pass with zero failures across authorization code resolution and client lookup workflows.
- Static type checking succeeds against resolved protocol SDK authentication types with zero diagnostic errors.
- Client storage implementations fulfill the protocol client contract without unhandled exceptions.

## Enforcement

- Verified by: Continuous integration automated test suites covering authentication and client storage contracts.
- Verified by: Static analysis and type checking during automated integration pipelines.
- Verified by: Mandatory peer review on pull requests touching authentication modules.
- Violation handling: Automated continuous integration build failure on contract mismatch or unapproved authentication interfaces.
- Violation handling: Blockage of pull request merges failing protocol authentication verification.
- Exception process: Exceptions require architectural review and explicit sign-off by the security and platform teams.
- Exception process: Any approved deviation must be documented with an architectural addendum explaining compatibility mitigations.