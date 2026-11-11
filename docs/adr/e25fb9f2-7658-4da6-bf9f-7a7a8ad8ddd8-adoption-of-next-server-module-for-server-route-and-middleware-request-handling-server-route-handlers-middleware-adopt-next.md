---
version: 2
name: e25fb9f2-7658-4da6-bf9f-7a7a8ad8ddd8-adoption-of-next-server-module-for-server-route-and-middleware-request-handling-server-route-handlers-middleware-adopt-next
description: "Adoption of next/server Module for Server Route and Middleware Request Handling: Server Route Handlers Middleware Adopt Next"
metadata:
  actual:
    adr_id: e25fb9f2-7658-4da6-bf9f-7a7a8ad8ddd8
    status: accepted
    candidate_group_id: 48ac5d5d-c71f-4fa8-a4cc-f3b9a043eb56
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - middleware.ts
      - src/app/api/**
---

# Adoption of next/server Module for Server Route and Middleware Request Handling: Server Route Handlers Middleware Adopt Next

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `middleware.ts`
- `src/app/api/**`

## Context

- The web application implements multiple server-side endpoints including data modification routes, authentication callbacks, external integration webhooks, and request middleware.
- Handling incoming HTTP traffic across these disparate server entry points requires uniform abstractions for query parameters, request headers, and cookie manipulation.
- Direct dependency on next/server is observed across all server endpoints and middleware to coordinate request lifecycle events.

## Problem Statement

Without a standardized server module for HTTP handling, disparate API endpoints and middleware risk adopting inconsistent request parsing, manual cookie manipulation, and fragmented header access patterns, leading to integration bugs and runtime incompatibilities across server environments.

## Decision

1. MUST: All server route handlers and middleware handlers MUST adopt next/server as the standard module for HTTP request parsing, response generation, and header and cookie lifecycle management.

## Policy Block

- MUST All server route handlers and middleware handlers MUST adopt next/server as the standard module for HTTP request parsing, response generation, and header and cookie lifecycle management.

In scope:
- Server-side HTTP route handlers handling API requests, webhooks, and authentication callbacks.
- Middleware interceptors evaluating incoming request headers, query parameters, and session cookies.

Out of scope:
- Client-rendered components and browser-only utility modules executing outside server runtimes.
- Static assets and build-time generation scripts that do not handle dynamic HTTP requests.

## Rationale

- The next/server module provides native primitives optimized for server runtimes, ensuring unified header, query parameter, and cookie handling across route handlers and middleware.
- Static analysis confirms consistent usage of next/server across all detected route handlers and middleware, validating it as the established architectural boundary for server request processing.
- Centralizing request parsing on next/server enables clean integration with downstream authentication and database helper modules.

## Consequences

Positive:
- Ensures consistent HTTP request parameter, header, and cookie handling across all server routes and middleware.
- Provides type-safe server primitives aligned with the application server execution environment.
- Eliminates redundant or ad-hoc HTTP request parsing implementations across endpoints.

Negative:
- Couples server route handlers and middleware directly to the next/server module and its specific request lifecycle conventions.
- Requires endpoint authors to accommodate server runtime constraints when handling streaming, headers, and cookies.

## Alternatives

- Adopting Node.js native HTTP request and response primitives across server routes (rejected)
  Rejected because: Native Node.js primitives lack native compatibility with edge middleware and introduce divergent request models across server runtimes.
  When valid: Valid only in standalone custom HTTP server runtimes operating outside modern server framework abstractions.
- Constructing custom wrapper abstractions over raw fetch Request and Response objects (rejected)
  Rejected because: Custom wrappers introduce maintenance overhead and lack seamless integration with middleware cookie synchronization.
  When valid: Valid when designing framework-agnostic microservice libraries intended for multi-framework distribution.

## Risks

- Breaking changes in server module APIs across major framework releases could affect route and middleware behavior.
  Mitigation: Adhere to the mandatory lock-version grounding policy and verify API compatibility against resolved versions prior to upgrades.
  Owner: Engineering Team
- Inconsistent cookie or header propagation between middleware and route handlers can cause authentication drift.
  Mitigation: Enforce standard request and response cookie mutation patterns through automated integration tests and code review.
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
- Route handlers must consume incoming parameters through the request abstraction and construct standard server responses using the module response primitives.
- Middleware implementations must manage cookie synchronization across both incoming request headers and outgoing response headers to maintain session continuity.

## Continuation Context


Verify commands:
- Discover the repository build and type-checking scripts from the project manifest and execute type verification to ensure compliance with server module interfaces.
- Locate the automated test suite configuration within the project and execute integration tests targeting server route handlers and middleware endpoints.

Accept when:
- All server route handlers and middleware compile without type errors using the server module interfaces.
- Automated endpoint tests pass, confirming expected query parsing, header inspection, and cookie mutation behaviors.

## Enforcement

- Verified by: Continuous integration type checking and static analysis workflows verifying server imports and signatures.
- Verified by: Peer code review for all route handler and middleware modifications.
- Violation handling: Pull requests utilizing non-standard HTTP primitives or failing server interface type checks will be blocked from merging.
- Exception process: Exceptions for specialized protocol endpoints require architecture review and documented justification detailing why standard server primitives cannot satisfy requirements.