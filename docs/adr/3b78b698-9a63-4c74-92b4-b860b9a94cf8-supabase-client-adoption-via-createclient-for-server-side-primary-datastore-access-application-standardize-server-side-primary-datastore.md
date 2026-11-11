---
version: 2
name: 3b78b698-9a63-4c74-92b4-b860b9a94cf8-supabase-client-adoption-via-createclient-for-server-side-primary-datastore-access-application-standardize-server-side-primary-datastore
description: "Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Application Standardize Server Side Primary Datastore"
metadata:
  actual:
    adr_id: 3b78b698-9a63-4c74-92b4-b860b9a94cf8
    status: accepted
    candidate_group_id: 62d1546e-93ee-41c9-99f3-d8361e4129f5
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - middleware.ts
      - src/app/**
      - src/components/session-area/**
      - src/lib/**
---

# Supabase Client Adoption via createClient for Server-Side Primary Datastore Access: Application Standardize Server Side Primary Datastore

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `middleware.ts`
- `src/app/**`
- `src/components/session-area/**`
- `src/lib/**`

## Context

- Server-side routes, page components, server actions, and middleware require coordinated access to the primary datastore with authenticated user session context.
- Uncoordinated direct database connections or fragmented client instantiations risk leaking credentials, bypassing row-level security policies, or mismanaging request-scoped cookies.
- Standardizing datastore interaction on Supabase client instances created via createClient establishes unified session propagation and query execution across server runtimes.

## Problem Statement

Server-side data retrieval and mutations across route handlers, server actions, middleware, and page components require a reliable datastore client that propagates request authentication cookies and enforces database access controls without duplicating connection configurations or leaking server privileges.

## Decision

1. MUST: The application MUST standardize all server-side primary datastore access and mutations on Supabase client instances created via createClient.

## Policy Block

- MUST The application MUST standardize all server-side primary datastore access and mutations on Supabase client instances created via createClient.

In scope:
- Server-rendered page routes requiring primary datastore querying
- Server actions executing mutations against primary datastore tables
- API route handlers coordinating persistence and authorization checks
- Edge and server request middleware managing datastore session tokens

Out of scope:
- Client-side browser UI components that do not interact directly with server datastores
- Stateless in-memory calculation utilities that operate purely on local data structures

Exceptions:
- EXC-001: A background job or offline administrative migration requires direct superuser database connections without request cookie context

## Rationale

- Standardizing on createClient ensures consistent session propagation and cookie lifecycle management across heterogeneous server contexts.
- Centralizing primary datastore queries through the client SDK allows row-level security and tenant-scoped policies to be consistently evaluated for every incoming request.
- The evidence confirms consistent adoption of createClient across route handlers, server actions, middleware, and server pages across dozens of files.

## Consequences

Positive:
- Provides a unified, secure access pattern for all primary datastore operations across server boundaries.
- Preserves authenticated user sessions and row-level security context across middleware, routes, and server actions.
- Eliminates redundant connection setup logic across distinct server endpoints.

Negative:
- Ties server-side data access tightly to the client SDK interfaces and runtime cookie mechanics.
- Requires developers to instantiate context-aware clients on each server execution instead of maintaining long-lived global connection pools.

## Alternatives

- Direct relational database connection pools via raw TCP and SQL clients (rejected)
  Rejected because: Direct database connections bypass row-level security policies and fail to integrate cleanly with request-scoped HTTP cookie authentication in serverless and edge runtimes.
  When valid: Valid when building persistent high-throughput background worker daemons with dedicated connection pooling infrastructure.
- Client-side direct datastore queries via public browser SDK keys (rejected)
  Rejected because: Bypasses server-side validation, prevents server action encapsulation, and increases client bundle sizes.
  When valid: Valid for static single-page applications without server runtimes.

## Risks

- Failure to properly propagate response cookies in middleware or route handlers could cause session desynchronization between client and datastore.
  Mitigation: Standardize client instantiation through central server helpers that manage cookie getter and setter delegates consistently.
  Owner: Platform Engineering
- Accidental leakage of elevated administrative client credentials in server actions or route handlers.
  Mitigation: Enforce strict linting rules and code reviews preventing service-level role keys from being referenced outside dedicated migration scripts.
  Owner: Security Architecture

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Implement server client helpers that accept request cookie stores to produce context-bound client instances for server actions and page routes.
- Ensure middleware wraps request and response headers properly when creating clients to allow cookie refreshing during navigation.

## Continuation Context


Verify commands:
- Discover the project verification scripts in the repository manifest and execute the test runner to validate primary datastore client instantiation.
- Discover the repository type-checking and linting configurations and execute the static analyzer across all server routes and actions to verify compliant createClient invocations.

Accept when:
- All server routes, server actions, and middleware instantiate primary datastore clients using createClient without manual connection setup.
- Static type analysis and repository verification scripts pass with zero errors across all server data access modules.

## Enforcement

- Verified by: Automated continuous integration checks executing repository type checks, unit tests, and lint rules on every pull request.
- Verified by: Peer code reviews auditing server actions, API routes, and page components for compliant createClient usage.
- Violation handling: Pull requests introducing unmanaged direct database connections or missing createClient cookie handling are blocked from merging.
- Violation handling: Violations identified in post-merge audits trigger immediate remediation tickets to refactor data access through standard client helpers.
- Exception process: Submit an architectural review request outlining why request-bound client instantiation cannot satisfy performance or migration constraints.
- Exception process: Obtain sign-off from Platform Engineering and document the exception in the project architecture log.