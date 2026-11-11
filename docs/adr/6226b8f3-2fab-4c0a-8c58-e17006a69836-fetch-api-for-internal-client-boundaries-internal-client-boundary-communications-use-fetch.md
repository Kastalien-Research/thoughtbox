---
version: 2
name: 6226b8f3-2fab-4c0a-8c58-e17006a69836-fetch-api-for-internal-client-boundaries-internal-client-boundary-communications-use-fetch
description: "Fetch API for Internal Client Boundaries: Internal Client Boundary Communications Use Fetch"
metadata:
  actual:
    adr_id: 6226b8f3-2fab-4c0a-8c58-e17006a69836
    status: accepted
    candidate_group_id: 9b54c14c-ef8a-4460-b182-541bea7d9c8b
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/lib/merge/**
---

# Fetch API for Internal Client Boundaries: Internal Client Boundary Communications Use Fetch

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`
- `src/lib/merge/**`

## Context

- Internal boundary communication requires uniform HTTP request composition when exchanging data across application routes and administrative service endpoints.
- Modules interacting with internal route handlers and backend services utilize direct HTTP dispatch with explicit query encoding and request header specification.
- Direct invocation of the standard HTTP client boundary eliminates coupling to proprietary SDK wrappers while requiring uniform handling of serialization and authentication.

## Problem Statement

Client-side modules and internal utility boundaries require a consistent, predictable approach to issuing HTTP requests against internal application endpoints and external administrative services. Relying on disparate client libraries or unstandardized parameter serialization risks inconsistent header management, credential leakage, and divergent error-handling semantics across boundary interfaces.

## Decision

1. MUST: All internal API client boundary communications MUST use the Fetch API for dispatching HTTP requests to internal endpoints and administrative service boundaries.

## Policy Block

- MUST All internal API client boundary communications MUST use the Fetch API for dispatching HTTP requests to internal endpoints and administrative service boundaries.

In scope:
- Internal API client utility modules invoking application endpoints
- Server-side and administrative workflows dispatching HTTP requests to backend service boundaries

Out of scope:
- In-memory inter-module function calls within the same compilation boundary
- Static asset retrieval handled directly by the presentation runtime

Exceptions:
- EXC-26-001: A dedicated third-party SDK provides real-time persistent subscription capabilities not supported by stateless HTTP requests

## Rationale

- Standardizing on the native Fetch API across internal boundaries reduces third-party bundle footprint and establishes a consistent, platform-native request pattern.
- Requiring explicit parameter serialization and standardized content-negotiation headers prevents parameter encoding bugs and ensures predictable response contracts.
- Encapsulating credentials within standard HTTP headers safeguards sensitive keys and aligns with standard authorization conventions across administrative boundaries.

## Consequences

Positive:
- Eliminates external client library bloat by utilizing platform-native Fetch API capabilities.
- Enforces consistent query parameter encoding and header configuration across all internal boundaries.
- Provides fine-grained control over request headers, credentials, and payload formatting.

Negative:
- Requires manual boilerplate implementation for response parsing, retries, and status code verification.
- Leaves request and response typing dependent on manual interface definitions rather than automated schema generation.

## Alternatives

- Adopting a third-party HTTP client library across all boundary layers (rejected)
  Rejected because: Introduces additional bundle dependencies and redundant abstraction layers over capabilities already provided by the platform runtime
  When valid: When advanced interceptors, automatic request cancellation, or specialized connection pooling features are mandatory across client environments
- Relying exclusively on proprietary vendor SDK clients for administrative service interactions (deferred)
  Rejected because: Direct administrative endpoints provide leaner integration for targeted administrative user queries without full client overhead
  When valid: When complete multi-resource SDK lifecycle management and reactive real-time bindings are actively required

## Risks

- Omission of response status verification leading to silent failures when HTTP responses return error status codes
  Mitigation: Enforce response ok checks and standardized error bubbling within all boundary helper functions
  Owner: Engineering Team
- Accidental exposure of administrative credentials in client-side bundle environments
  Mitigation: Restrict administrative boundary requests to server-executed contexts and validate environment variable scopes via continuous integration linting
  Owner: Security Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Construct all parameterized URLs using URLSearchParams or encodeURIComponent to guarantee safe query string formatting.
- Encapsulate endpoint-specific request logic inside dedicated integration functions returning strongly typed domain representations.

## Continuation Context


Verify commands:
- Discover and run the project's static analysis and type verification checks to validate boundary client invocations.
- Discover and run the test suite covering internal boundary functions and HTTP integration mocks.

Accept when:
- All boundary HTTP requests pass type checks and parameter encoding assertions without errors.
- Static security checks confirm administrative authorization headers and service keys are isolated from public client bundles.

## Enforcement

- Verified by: Automated continuous integration checks validating static types and lint rules
- Verified by: Peer code review verifying encapsulation of Fetch API calls and credential handling
- Violation handling: Pull requests containing unencoded query parameters or direct credential exposure in client contexts are blocked from merging until corrected.
- Exception process: Submit an architectural review request detailing technical necessity and risk mitigation for review and sign-off by the architecture group.