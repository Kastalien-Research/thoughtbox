---
version: 2
name: 161d9912-deff-4a2d-b6a9-8c8230b57364-adoption-of-supabase-ssr-for-server-and-client-runtime-isolation-engineers-discover-project-dependency-lock-artifact
description: "Adoption of @supabase/ssr for Server and Client Runtime Isolation: Engineers Discover Project Dependency Lock Artifact"
metadata:
  actual:
    adr_id: 161d9912-deff-4a2d-b6a9-8c8230b57364
    status: accepted
    candidate_group_id: 4d420b84-149f-4fd3-8aa4-5241d34ed725
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/lib/supabase/**
---

# Adoption of @supabase/ssr for Server and Client Runtime Isolation: Engineers Discover Project Dependency Lock Artifact

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/lib/supabase/**`

## Context

- Web runtime environments operate across distinct server and browser execution contexts, each requiring different mechanisms for managing authentication credentials and session tokens.
- Server-side rendering and request handlers require access to incoming request headers and cookie stores to authenticate queries without leaking private session state across concurrent requests.
- Browser execution contexts rely on client-side state persistence and public runtime environment variables without direct access to privileged server header APIs.
- Shared database schemas necessitate unified type definitions across all database access entry points to maintain type safety.

## Problem Statement

Managing client initialization across distinct browser and server execution boundaries risks cross-request session leakage, inconsistent authentication state, and runtime exceptions when server-only APIs are accessed in client contexts. The application requires a unified, type-safe integration pattern that encapsulates cookie-based session management for server environments while maintaining a dedicated client initialization module for browser runtimes.

## Decision

1. MUST: Engineers MUST discover the project dependency lock artifact and resolve the exact installed version of @supabase/ssr before calling its initialization APIs.

## Policy Block

- MUST Engineers MUST discover the project dependency lock artifact and resolve the exact installed version of @supabase/ssr before calling its initialization APIs.

In scope:
- All data access and authentication modules targeting the managed database service from browser or server execution contexts.
- Request lifecycle handlers requiring authenticated session access via cookie storage.

Out of scope:
- Standalone utility modules that do not interface with the database service.
- Static assets or build-time code generation scripts that operate outside application runtime lifecycles.

## Rationale

- Import analysis across data modules confirms consistent reliance on @supabase/ssr to manage runtime separation between server-rendered and browser-executed environments.
- Cookie store delegation allows server execution paths to synchronize session tokens dynamically without persisting shared global state across requests.
- Binding centralized database schema types at client instantiation guarantees compiler verification for all downstream database queries.

## Consequences

Positive:
- Eliminates cross-request session contamination in server-rendered environments through request-scoped cookie store adapters.
- Establishes a single source of truth for runtime database configuration across execution targets.
- Enforces compile-time schema type checking across both server and client data operations.

Negative:
- Requires maintaining distinct factory abstractions for server and client execution boundaries.
- Couples session management logic directly to request cookie lifecycle handling, requiring careful header mutation management.
- Requires disciplined synchronization between database schema migrations and generated type definitions.

## Alternatives

- Direct instantiation using the core Supabase client without SSR cookie adapters (rejected)
  Rejected because: Lacks native integration for cookie-based session synchronization in server rendering contexts, risking session desynchronization between client and server runtimes.
  When valid: Valid only in purely client-rendered single-page applications without server-side rendering or edge request handlers.
- Custom session cookie propagation layer built directly on low-level fetch wrappers (rejected)
  Rejected because: Increases maintenance overhead and introduces security risks around manual cookie parsing, token refresh lifecycles, and session renewal.
  When valid: Valid when operating within non-standard runtime environments unsupported by official SSR integration packages.

## Risks

- Cookie mutation attempts during server component rendering where response headers are already sealed can trigger runtime errors.
  Mitigation: Encapsulate cookie write operations in server actions or route handlers, keeping read-only cookie access during component rendering.
  Owner: Frontend engineering team
- Drift between deployed database schemas and local database type bindings leading to unhandled runtime type mismatches.
  Mitigation: Integrate automated type generation into the build and validation pipeline to verify local types match database migrations.
  Owner: Data engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Ensure that server client factory invocations instantiate a fresh client per incoming request rather than caching client instances across requests.
- Verify that public environment configuration keys are accessible in both browser and server runtime contexts.

## Continuation Context


Verify commands:
- Discover the project verification script from the root manifest and execute the test runner to validate client instantiation across environments.
- Discover and run the project type checker to verify that database type bindings conform to all query interfaces.
- Discover and execute the project linter to ensure server-specific headers and cookies are not imported into client modules.

Accept when:
- Client instantiation tests execute without errors across both server and browser test environments.
- Type checking passes with zero compiler errors across all modules importing the client factories.
- Lint checks confirm no boundary crossing between server header modules and client-side entry points.

## Enforcement

- Verified by: Continuous integration type checking and static analysis workflows.
- Verified by: Peer code review for changes modifying data client factories or session handling.
- Violation handling: Pull requests violating runtime boundary constraints or introducing untyped client initializations are blocked from merging.
- Violation handling: Non-conforming implementations must be refactored to use the standardized factory modules.
- Exception process: Exceptions require documented architectural review and formal approval from lead engineers before implementation.