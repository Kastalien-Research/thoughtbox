---
version: 2
name: 855ee3e6-cb1c-45b9-91f8-3ede418c3855-next-js-server-actions-and-route-handlers-for-service-boundaries-server-actions-handling-user-mutations-accept
description: "Next.js Server Actions and Route Handlers for Service Boundaries: Server Actions Handling User Mutations Accept"
metadata:
  actual:
    adr_id: 855ee3e6-cb1c-45b9-91f8-3ede418c3855
    status: accepted
    candidate_group_id: 914d6519-b1e2-4337-b21a-77156e9bedd7
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/components/session-area/**
      - src/lib/**
---

# Next.js Server Actions and Route Handlers for Service Boundaries: Server Actions Handling User Mutations Accept

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`
- `src/components/session-area/**`
- `src/lib/**`

## Context

- The web application requires structured service boundaries to handle user mutations, third-party webhooks, and authenticated backend interactions.
- Standardizing boundary entry points prevents fragmented data access patterns and ensures server-side security enforcement.
- The application utilizes framework-provided server execution primitives to bind client interactions directly to backend service operations.

## Problem Statement

Without explicit architectural service boundaries, web applications often fragment mutation logic across ad-hoc client calls, disparate API routes, and unsecured endpoints. This fragmentation increases maintenance overhead, risks bypassing authorization checks, and complicates cache invalidation across the frontend and backend.

## Decision

1. MUST: Server actions handling user mutations MUST accept standard form data payloads and extract parameters using FormData retrieval methods rather than exposing raw database models or untyped request bodies.

## Policy Block

- MUST Server actions handling user mutations MUST accept standard form data payloads and extract parameters using FormData retrieval methods rather than exposing raw database models or untyped request bodies.

In scope:
- All client-to-server mutation operations triggered from user interface components.
- External webhook ingestion endpoints and third-party service integration callbacks.
- Server-side data access procedures requiring authenticated service client instantiation.

Out of scope:
- Read-only data transformations within pure client utility modules.
- Internal data structure mappings and pure client-side state transitions.

Exceptions:
- EXC-23-001: Third-party SDKs require dedicated streaming or WebSocket protocol connections that bypass HTTP request-response boundaries

## Rationale

- Next.js Server Actions establish a type-safe boundary between the user interface and backend services without requiring manual REST endpoint maintenance.
- Extracting parameters through standardized boundary primitives ensures consistent data validation and integration with server-side authentication clients.
- Separating internal mutations into server actions while dedicating route handlers to webhooks provides clear boundary segregation for machine and human interactions.

## Consequences

Positive:
- Eliminates boilerplate API endpoint routing for internal user interface state mutations.
- Provides direct integration with server-side cache invalidation and framework navigation lifecycles.
- Centralizes authentication and authorization checks on the server before interacting with backend databases and third-party APIs.

Negative:
- Couples client mutation semantics to framework-specific server execution contexts.
- Requires diligent input validation for form data extraction to prevent runtime parameter mismatches.
- Requires distinct mental models for user-facing server actions versus external integration route handlers.

## Alternatives

- Exposing traditional REST API routes for all client-side mutations (rejected)
  Rejected because: Creating dedicated REST route endpoints for every internal user interaction introduces unnecessary serialization boilerplate, manual endpoint routing, and disjointed client-side cache invalidation compared to colocated server actions.
  When valid: When client applications are deployed independently on separate domains or native platforms requiring public OpenAPI specifications.
- Direct client-side database calls via browser client SDKs (rejected)
  Rejected because: Executing mutations directly from client runtime environments exposes operational secrets, bypasses centralized backend validation, and weakens service boundary encapsulation.
  When valid: When building lightweight static applications that rely entirely on public row-level security without server-side business orchestration.
- Next.js Server Actions and Route Handlers for Service Boundaries (accepted)
  Rejected because: Not rejected; accepted as the standardized architecture for application service boundaries.
  When valid: When developing full-stack web applications with unified server execution contexts and external webhook boundaries.

## Risks

- Silent payload errors if form data fields are renamed without synchronizing boundary extraction logic.
  Mitigation: Enforce strict schema validation and static boundary typing across all server action inputs.
  Owner: Engineering Team
- Accidental execution of unauthorized operations if authentication context is not verified inside every server action.
  Mitigation: Require authenticated server client instantiation and session validation at the beginning of each boundary handler.
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
- Group related server actions by feature domain and co-locate them near their calling interfaces.
- Ensure all route handlers parsing external webhooks verify cryptographic signatures prior to payload processing.

## Continuation Context


Verify commands:
- Discover the workspace script runner and execute the project typecheck script across all service boundary modules.
- Discover the repository test runner and execute the boundary and integration test suites.
- Discover and execute the repository static analysis and linting suite to verify compliance with server boundary conventions.

Accept when:
- All service boundary modules pass static type checking without interface mismatches or missing parameter validations.
- All automated integration and unit test suites for server actions and route handlers pass with zero test failures.
- Static analysis validates that all boundary mutations route through authorized server execution boundaries.

## Enforcement

- Verified by: Automated code review and lint checks for boundary handler conventions.
- Verified by: Continuous integration test passes verifying server action and route handler behavior.
- Verified by: Architectural peer review of all pull requests introducing or modifying service boundaries.
- Violation handling: Pull requests bypassing server boundaries or performing unauthorized mutations will be blocked during code review.
- Violation handling: Violations identified in post-merge audits must be refactored into compliant server actions or route handlers as high-priority technical debt.
- Exception process: Exceptions must be documented with an architectural rationale and approved by the lead architect prior to merging.