---
version: 2
name: 9915a8cc-e8e2-41d9-83b4-915da8c2a347-supabase-ssr-client-adoption-for-server-and-browser-contexts-prior-adopting-upgrading-supabase-ssr-engineers
description: "@supabase/ssr Client Adoption for Server and Browser Contexts: Prior Adopting Upgrading Supabase Ssr Engineers"
metadata:
  actual:
    adr_id: 9915a8cc-e8e2-41d9-83b4-915da8c2a347
    status: accepted
    candidate_group_id: af4b62a7-86c3-4767-bdfb-69c561be42ac
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# @supabase/ssr Client Adoption for Server and Browser Contexts: Prior Adopting Upgrading Supabase Ssr Engineers

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`

## Context

- Server-side rendering and client-side interactions require consistent authentication state and database session coordination across environment boundaries.
- Direct database connections or ad-hoc query clients without unified cookie and session storage adapters lead to session desynchronization between server execution and client hydration.
- Consolidating database access on `@supabase/ssr` alongside generated repository database types provides unified type safety and session continuity across both server contexts and client user interfaces.

## Problem Statement

Interacting with backend database services from both server-rendered components and client-side user interfaces introduces session drift, authentication synchronization failures, and untyped database operations when clients are instantiated inconsistently across execution boundaries.

## Decision

1. MUST: Prior to adopting or upgrading `@supabase/ssr`, engineers MUST inspect the repository lock artifact to verify the exact resolved version and validate that client instantiation APIs conform to that specific version documentation.

## Policy Block

- MUST Prior to adopting or upgrading `@supabase/ssr`, engineers MUST inspect the repository lock artifact to verify the exact resolved version and validate that client instantiation APIs conform to that specific version documentation.

In scope:
- All data access modules, database query routines, and authentication handlers executing within server runtimes.
- All client-side user interface components managing authentication credentials, password resets, or browser-based data operations.

Out of scope:
- Static utility functions and formatting helpers that do not interact with authentication state or database services.
- Third-party integrations that communicate through independent external HTTP protocols without database session requirements.

## Rationale

- Adopting `@supabase/ssr` ensures that authentication tokens and cookie handling adhere to server and browser execution models without custom token storage code.
- Enforcing typed client creation via repository schema definitions eliminates runtime schema mismatch errors and guarantees compile-time verification across queries.
- Centralizing client initialization patterns prevents security regressions from exposed secrets or unauthenticated data layer leakage.

## Consequences

Positive:
- Standardized authentication session handling eliminates token desynchronization between server rendering and browser interaction.
- Generated database schema typing provides compile-time query verification and autocomplete across data layer modules.
- Separation of data access logic from presentation components improves maintainability and test isolation.

Negative:
- Coupling to the client library lifecycle necessitates coordinated dependency updates across client and server modules.
- Threading server context headers and cookie stores into client factories adds boilerplate to data access routines.
- Schema modifications require regenerating internal database types before changes can propagate through client calls.

## Alternatives

- Direct untyped Supabase client instantiation without server-side rendering adapters (rejected)
  Rejected because: Lacks automated cookie synchronization between server and client boundaries, leading to authentication state mismatches and missing compile-time schema validation.
  When valid: Valid only in standalone script environments or isolated CLI utilities operating outside interactive web application runtimes.
- Custom HTTP fetch wrappers implementing manual session token management and direct REST endpoints (rejected)
  Rejected because: Increases maintenance burden by requiring custom token refresh, cookie parsing, and manual type mapping across every data endpoint.
  When valid: Valid when operating in constrained environments where third-party client runtimes cannot be bundled.

## Risks

- Breaking API changes in client library major releases affecting server or client factory signatures
  Mitigation: Verify resolved dependency versions against project lock artifacts and adhere strictly to version-specific documentation before updating
  Owner: Full-stack engineering team
- Inadvertent exposure of administrative service keys in client-side bundle code
  Mitigation: Enforce strict separation between public runtime environment variables and privileged server credentials through configuration checks
  Owner: Security and platform engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Configure server-side client helpers to consume incoming request headers or cookie accessors provided by the runtime framework, ensuring session cookies are forwarded appropriately during database calls.
- Bind generated database schema interfaces directly to `@supabase/ssr` factory invocations to guarantee that all downstream query builder methods produce typed results.

## Continuation Context


Verify commands:
- Discover the project test execution script from the dependency manifest and run the test suite to verify client initialization and data access operations.
- Discover the project type verification script from the dependency manifest and execute it to confirm full type safety across database client calls.

Accept when:
- All unit and integration tests covering database queries and authentication flows pass with zero errors.
- Type verification passes cleanly across all modules importing the client library and repository database types without type assertions or suppressions.

## Enforcement

- Verified by: Automated continuous integration checks executing type verification and test suites on all code submissions.
- Verified by: Peer code review verifying that all database queries and authentication handlers consume approved client factories.
- Violation handling: Pull requests containing untyped database calls or bypassing client factory routines will be blocked from merging until corrected.
- Violation handling: Static analysis and build validation failures will halt the deployment pipeline.
- Exception process: Submit an architectural review request outlining why standard client instantiation cannot satisfy specific runtime constraints, requiring approval from the technical architecture lead.