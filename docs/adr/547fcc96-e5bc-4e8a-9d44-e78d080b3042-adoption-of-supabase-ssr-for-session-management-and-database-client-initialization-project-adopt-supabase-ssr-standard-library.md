---
version: 2
name: 547fcc96-e5bc-4e8a-9d44-e78d080b3042-adoption-of-supabase-ssr-for-session-management-and-database-client-initialization-project-adopt-supabase-ssr-standard-library
description: "Adoption of @supabase/ssr for Session Management and Database Client Initialization: Project Adopt Supabase Ssr Standard Library"
metadata:
  actual:
    adr_id: 547fcc96-e5bc-4e8a-9d44-e78d080b3042
    status: accepted
    candidate_group_id: 78b9c376-a306-46aa-9a41-98f276cda264
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - middleware.ts
      - src/app/**
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Session Management and Database Client Initialization: Project Adopt Supabase Ssr Standard Library

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `middleware.ts`
- `src/app/**`
- `src/lib/supabase/**`

## Context

- The web application renders components across both server and client environments while executing request routing through edge middleware.
- User authentication and database operations require seamless credential sharing and session persistence without state fragmentation between rendering tiers.
- Direct browser storage mechanisms cannot provide authenticated user contexts to server-rendered pages or edge routing logic prior to client hydration.

## Problem Statement

Web applications operating across distributed rendering tiers (edge middleware, server components, and browser clients) suffer from authentication state divergence when session credentials rely strictly on client-side storage mechanisms. Without a unified cookie-mediated client initialization strategy, server-rendered components and edge routing layers cannot authenticate requests or refresh expired credentials before delivering markup to the client.

## Decision

1. MUST: The project MUST adopt @supabase/ssr as the standard library for instantiating database clients and synchronizing session cookies across server, client, and middleware contexts.

## Policy Block

- MUST The project MUST adopt @supabase/ssr as the standard library for instantiating database clients and synchronizing session cookies across server, client, and middleware contexts.

In scope:
- All modules instantiating database clients or managing authentication sessions within client, server, or middleware execution environments.
- All routes, components, and data access utilities interacting with authenticated backend services.

Out of scope:
- Standalone build scripts and migration utilities executing outside the web application request lifecycle.
- Public static assets and unauthenticated endpoints that do not inspect or mutate session identity.

## Rationale

- Evidence across client, server, and middleware files demonstrates a systematic pattern of instantiating database clients through @supabase/ssr with synchronized cookie storage handlers.
- Using dedicated server-side rendering library helpers prevents credential leakage, enables pre-render data fetching, and centralizes authentication state handling within standard HTTP cookies.
- Binding client instances to shared database types ensures static verification of schema interactions across all architectural tiers.

## Consequences

Positive:
- Ensures consistent authenticated state across server components, edge middleware, and browser clients.
- Eliminates client-side authentication flickering by hydrating session tokens directly from request cookies during initial render.
- Enforces centralized type safety across query and mutation boundaries using shared database type schemas.

Negative:
- Couples server and middleware request processing directly to cookie read and write lifecycle methods.
- Requires distinct initialization strategies across browser, server component, and middleware execution tiers.
- Introduces potential session divergence if middleware does not consistently refresh auth tokens on inbound requests.

## Alternatives

- Direct client-side authentication using standard browser storage without server cookie synchronization (rejected)
  Rejected because: Fails to maintain authenticated session context across server-side rendering and edge request middleware, causing authentication state divergence and rendering flashes.
  When valid: Valid strictly for static client-only single-page applications without server rendering or edge request interception.
- Custom authentication session cookie serialization and token refresh middleware implementation (rejected)
  Rejected because: Introduces significant maintenance overhead, security risk regarding cookie flag handling, and risk of token refresh race conditions across concurrent requests.
  When valid: Valid when working with backend authentication services that do not provide dedicated SSR client adapters.

## Risks

- Cookie mutation in middleware might fail to propagate to downstream server component rendering if response headers are not properly forwarded.
  Mitigation: Ensure middleware actively writes updated cookie headers to both the incoming request and outgoing response when refreshing authentication tokens.
  Owner: Web Architecture Team
- Accidental import of server-specific cookie adapters into client component bundles leading to runtime failures.
  Mitigation: Abstract client initialization into dedicated factory functions per runtime tier to prevent leaking server-only methods into client bundles.
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
- Ensure middleware response objects properly forward mutated cookies when tokens are refreshed during request evaluation.
- Bind generated database type definitions directly into client instantiation factories to guarantee schema consistency across query invocations.

## Continuation Context


Verify commands:
- Discover and execute the project verification script responsible for static code analysis, linting, and module boundary checks across all application tiers.
- Discover and execute the project test runner to validate that server, client, and middleware database client adapters execute without runtime exceptions.

Accept when:
- Static analysis confirms all database client creation and authentication session reads in server, client, and middleware boundaries utilize the designated SSR library adapter.
- Project verification and type-checking routines pass without unresolved imports or type mismatches against database definitions.
- No unauthorized client instantiation or direct token manipulation bypassing the cookie adapter exists in the codebase.

## Enforcement

- Verified by: Automated static analysis and linting rules prohibiting non-standard client creation or direct token storage.
- Verified by: Peer code review validating correct cookie store binding across server, client, and middleware boundaries.
- Verified by: Continuous integration build and test verification passes.
- Violation handling: Pull requests containing non-compliant client initialization or unmanaged session cookies will be rejected automatically by continuous integration gates.
- Violation handling: Identified violations must be refactored to use standard library factory functions and cookie handling patterns.
- Exception process: Exceptions must be requested via architectural review with documented justification demonstrating why standard cookie-based SSR integration cannot satisfy technical requirements.
- Exception process: Approved exceptions must specify compensatory session management and boundary isolation mechanisms before code merge.