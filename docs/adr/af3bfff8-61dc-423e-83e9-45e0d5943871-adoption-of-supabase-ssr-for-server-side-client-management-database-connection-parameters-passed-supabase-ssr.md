---
version: 2
name: af3bfff8-61dc-423e-83e9-45e0d5943871-adoption-of-supabase-ssr-for-server-side-client-management-database-connection-parameters-passed-supabase-ssr
description: "Adoption of @supabase/ssr for Server-Side Client Management: Database Connection Parameters Passed Supabase Ssr"
metadata:
  actual:
    adr_id: af3bfff8-61dc-423e-83e9-45e0d5943871
    status: accepted
    candidate_group_id: 8adcaf56-94ec-4091-b175-379275ff43d5
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/lib/**
---

# Adoption of @supabase/ssr for Server-Side Client Management: Database Connection Parameters Passed Supabase Ssr

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`
- `src/lib/**`

## Context

- Server-side application logic requires authenticated access to database operations and third-party service workflows.
- Server components, server actions, and route handlers require unified cookie-based session management without exposing service secrets.
- Multiple server modules across the application independently configure Supabase database clients using server header and cookie accessors.

## Problem Statement

Server-side rendering and mutation workflows require a consistent, secure mechanism to read and persist user authentication state across requests without desynchronizing cookies or leaking credentials to the client.

## Decision

1. MUST: Database connection parameters passed to `@supabase/ssr` client factories MUST be sourced from validated server environment configuration variables.

## Policy Block

- MUST Database connection parameters passed to `@supabase/ssr` client factories MUST be sourced from validated server environment configuration variables.

In scope:
- Server actions performing transactional mutations or external service orchestrations.
- Server-side database access layers and query utilities requiring authenticated user context.
- Internal server utility modules managing database sessions.

Out of scope:
- Client-side browser components managing presentation state.
- External webhook handlers that validate incoming payloads without requiring user session cookies.

## Rationale

- Adopting `@supabase/ssr` aligns server client instantiation with server header and cookie access patterns, ensuring session tokens persist accurately across server actions.
- Static analysis demonstrates consistent usage across server actions, database utilities, and service integration modules, establishing an existing architectural convention.
- Coupling typed schema definitions with server client instantiation enforces compile-time safety across database interactions.

## Consequences

Positive:
- Ensures consistent, secure propagation of authentication sessions between server rendering and server mutation routines.
- Prevents accidental leakage of client credentials and centralizes database connection configurations on the server.
- Provides strong schema typing for database queries through generated database type bindings.

Negative:
- Server client instantiation is coupled to request-scoped cookie headers, requiring careful handling in read-only rendering phases.
- Additional abstraction layer requires strict adherence to cookie handling contracts across server actions and data access functions.

## Alternatives

- Direct instantiation of the standard Supabase JavaScript client in server contexts (rejected)
  Rejected because: Lacks native integration with server request cookie stores, causing authentication session desynchronization across server boundaries.
  When valid: Client-only single-page applications operating without server rendering or server action pipelines.
- Custom cookie synchronization wrappers around raw HTTP endpoints (rejected)
  Rejected because: Increases maintenance overhead and reimplements session persistence protocols already managed by official SSR adapters.
  When valid: Environments where framework adapters cannot run due to incompatible runtime constraints.

## Risks

- Attempting to mutate cookies during read-only server component rendering phases throws runtime exceptions.
  Mitigation: Wrap cookie modification callbacks in defensive try-catch handlers to prevent runtime failures in read-only execution contexts.
  Owner: Engineering Team
- Misconfiguration of environment variables could inadvertently expose elevated service privileges to client contexts.
  Mitigation: Enforce strict separation between public anonymous configuration keys and elevated administrative secrets in environment definitions.
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
- Centralize server client construction in a dedicated internal module to ensure consistent cookie adapter wiring across server actions and data queries.
- Implement defensive error handling within cookie set and remove callbacks to prevent runtime errors during read-only server component renders.

## Continuation Context


Verify commands:
- Discover and run the project static analysis and linting scripts to verify server client import conformity.
- Discover and execute the project automated test suite covering server actions and data access utilities.
- Discover and execute the project type-checking routine to confirm database schema binding compatibility.

Accept when:
- All server-side data access and authentication operations instantiate clients through `@supabase/ssr` request adapters.
- The project type-checking and automated test suites execute and exit without failure.
- No direct client-side SDK instantiations appear in server actions or server-side data modules.

## Enforcement

- Verified by: Automated continuous integration checks executing repository type verification and linting.
- Verified by: Peer code review for server actions, route handlers, and database access utilities.
- Violation handling: Pull requests containing unapproved database client construction patterns are blocked from merging.
- Violation handling: Violating modules must be refactored to consume the standardized server client initialization adapter.
- Exception process: Submit an architectural waiver detailing runtime constraints that prevent the use of standard SSR cookie adapters.
- Exception process: Obtain approval from the technical architecture review team before merging non-standard client initializations.