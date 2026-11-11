---
version: 2
name: 0f5dd077-b3df-4c0a-9b84-0e0a7c910190-model-context-protocol-sdk-modelcontextprotocol-sdk-authentication-module-adoption-oauth-authorization-server-workflows-client-record
description: "Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Oauth Authorization Server Workflows Client Record"
metadata:
  actual:
    adr_id: 0f5dd077-b3df-4c0a-9b84-0e0a7c910190
    status: accepted
    candidate_group_id: d76778ae-1112-4ac9-b29f-9117c34b6f87
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/auth/oauth/**
---

# Model Context Protocol SDK (@modelcontextprotocol/sdk) Authentication Module Adoption: Oauth Authorization Server Workflows Client Record

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/auth/oauth/**`

## Context

- The service architecture requires a secure, interoperable authorization layer to delegate access for client integrations communicating over the Model Context Protocol.
- Standardizing authentication through protocol-native abstractions avoids fractured identity handling and ensures interoperability with external clients.
- The codebase establishes OAuth provider routing, cryptographic code challenge handling, and persistent client metadata retrieval using dedicated SDK auth components.

## Problem Statement

Integrating secure authorization delegation within a protocol-compliant service requires structured provider lifecycles and consistent client storage. Without a standardized interface foundation, authorization logic risks fragmenting across custom handlers, increasing maintenance overhead and vulnerability exposure.

## Decision

1. MUST: OAuth authorization server workflows and client record management MUST standardize on `@modelcontextprotocol/sdk` authentication submodules for protocol-level identity and delegation contracts.

## Policy Block

- MUST OAuth authorization server workflows and client record management MUST standardize on `@modelcontextprotocol/sdk` authentication submodules for protocol-level identity and delegation contracts.

In scope:
- Authentication and authorization subsystems implementing OAuth server endpoints.
- Client storage and registration boundaries interfacing with Model Context Protocol consumers.

Out of scope:
- Internal microservice-to-microservice transport boundaries operating with preshared network credentials.
- Stateless utility functions unrelated to authentication or authorization delegation.

Exceptions:
- EXC-20-001: Development environments requiring mock authentication providers that bypass cryptographic verification.

## Rationale

- Adopting `@modelcontextprotocol/sdk` authentication modules provides native protocol compliance, reducing integration friction across standard client ecosystems.
- Encapsulating client metadata handling within `@modelcontextprotocol/sdk/server/auth/clients.js` separates caching and persistence concerns from authorization endpoint logic.
- Using standardized cryptographic primitives and protocol types guarantees consistent validation of authorization codes and redirect states.

## Consequences

Positive:
- Unified authentication architecture adhering directly to upstream protocol specifications.
- Clear separation of concerns between provider routing, cryptographic verification, and client storage tiers.
- Accelerated client onboarding through standardized OAuth authorization and consent endpoints.

Negative:
- Coupling to `@modelcontextprotocol/sdk` authentication subpath exports and lifecycle hooks.
- Operational overhead of maintaining dual caching and persistence synchronization for client records.

## Alternatives

- Custom In-House OAuth 2.0 Server Implementation (rejected)
  Rejected because: Bespoke authorization implementations duplicate protocol specifications, increase vulnerability risk, and diverge from Model Context Protocol client expectations.
  When valid: When protocol specifications fall outside Model Context Protocol compatibility requirements or require proprietary token exchange formats.
- Third-Party Standalone Identity Provider Gateway (deferred)
  Rejected because: External identity brokers introduce additional runtime infrastructure requirements and decouple authorization flow state from local protocol server endpoints.
  When valid: When enterprise single-sign-on federation and centralized user lifecycle management take precedence over embedded protocol server operations.

## Risks

- Upstream breaking changes across minor releases of `@modelcontextprotocol/sdk` could disrupt provider or client storage interfaces.
  Mitigation: Pin resolved versions in dependency lock artifacts and enforce comprehensive interface verification during integration pipelines.
  Owner: Engineering Team
- In-memory or split-tier client state management between persistence layers and memory caches may create cache invalidation inconsistencies.
  Mitigation: Establish strict synchronization boundaries between client cache layers and underlying persistence stores.
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
- Derive client storage adapters by implementing the contract expectations defined in the SDK client interfaces while maintaining clean separation from underlying persistence databases.
- Ensure consent and authorization endpoints sanitize and validate redirect parameters against registered client callback domains prior to issuing authorization codes.

## Continuation Context


Verify commands:
- Discover the project build and test execution scripts declared in the repository configuration and execute the test suite covering authentication provider flows.
- Execute the project static analysis and type checking utilities to confirm conformance with `@modelcontextprotocol/sdk` authentication interfaces.
- Inspect the dependency lock artifact to confirm installed versions of `@modelcontextprotocol/sdk` match repository constraints.

Accept when:
- All automated authentication provider test suites pass without assertion failures.
- Static type analysis confirms zero type errors across modules importing `@modelcontextprotocol/sdk` authentication contracts.
- OAuth provider and client storage components strictly conform to the expected `@modelcontextprotocol/sdk` interface signatures.

## Enforcement

- Verified by: Automated continuous integration checks executing static type analysis and unit test suites.
- Verified by: Peer code review verifying adherence to protocol SDK interfaces and cryptographic conventions.
- Violation handling: Pull requests introducing non-compliant authorization patterns or bypassing SDK interfaces will be blocked from merging.
- Violation handling: Unvalidated client or token manipulation will trigger immediate remediation requirements.
- Exception process: Exceptions must be submitted via architectural review request and approved by the lead architect and security maintainers prior to merging.