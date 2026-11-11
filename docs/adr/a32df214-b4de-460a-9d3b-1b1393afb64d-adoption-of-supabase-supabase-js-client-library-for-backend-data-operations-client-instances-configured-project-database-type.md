---
version: 2
name: a32df214-b4de-460a-9d3b-1b1393afb64d-adoption-of-supabase-supabase-js-client-library-for-backend-data-operations-client-instances-configured-project-database-type
description: "Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Client Instances Configured Project Database Type"
metadata:
  actual:
    adr_id: a32df214-b4de-460a-9d3b-1b1393afb64d
    status: accepted
    candidate_group_id: 8f4330d9-ce9f-49cc-a36e-2f35fa16fc2a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of @supabase/supabase-js Client Library for Backend Data Operations: Client Instances Configured Project Database Type

Status: proposed
Date: 2025-02-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`

## Context

- Backend service routes and domain data query modules require unified access to persistent database records and administrative capabilities
- Unstructured database access patterns across disparate handlers risk inconsistent authentication, unvalidated payloads, and credential fragmentation
- Static analysis detects consistent adoption of the @supabase/supabase-js library alongside project database type definitions across server-side handlers and query utilities

## Problem Statement

Inconsistent data access mechanisms and fragmented backend API calls across server routes lead to disparate credential handling, missing type safety, and increased risk of operational failures during database interactions.

## Decision

1. MUST: Client instances MUST be configured with project database type contracts to ensure type safety across all queries and data mutations.

## Policy Block

- MUST Client instances MUST be configured with project database type contracts to ensure type safety across all queries and data mutations.

In scope:
- Server-side route handlers executing database queries or administrative actions
- Domain knowledge query modules and graph persistence libraries
- Authentication lifecycle and claim handling flows interacting with backend user management

Out of scope:
- Client-side browser presentation components without direct backend database access requirements
- Static asset delivery and routing configurations unrelated to data persistence

Exceptions:
- EXC-20-001: A server handler must invoke an administrative authentication endpoint not supported by the client SDK version

## Rationale

- Standardizing on @supabase/supabase-js eliminates ad-hoc network request handling and ensures consistent error parsing and authentication header propagation across all server routes
- Integrating shared database type contracts with client instances provides compile-time verification of schema queries and mutations across application boundaries
- A centralized client creation pattern simplifies governance of public and administrative credentials across runtime environments

## Consequences

Positive:
- Establishes a uniform database query interface and client lifecycle across all server routes and data layers
- Enables compile-time type safety for table queries, schema fields, and response payloads
- Centralizes configuration of service endpoints and authentication headers within standardized client instances

Negative:
- Introduces tight coupling to a single platform vendor data and authentication access abstraction
- Requires careful credential governance to prevent administrative service role keys from exposure to untrusted execution scopes
- Demands continuous synchronization between backend database schemas and generated type definition artifacts

## Alternatives

- Direct HTTP REST API invocations against backend endpoints without client SDK abstraction (rejected)
  Rejected because: Direct HTTP calls require manual header construction, custom serialization, and manual error normalization, which increases operational error rates and forfeits compile-time database type enforcement
  When valid: Valid only in constrained edge runtimes where client dependency footprint cannot be accommodated
- Third-party relational object-relational mapping frameworks with direct connection pooling (rejected)
  Rejected because: Bypasses the unified authentication, Row Level Security enforcement, and service-role administrative controls provided by the platform ecosystem
  When valid: Valid when managing dedicated self-hosted relational database clusters requiring custom connection poolers and schema migrations outside platform boundaries

## Risks

- Accidental leakage of administrative service role keys into client-accessible bundles
  Mitigation: Ensure administrative client instances are only constructed in server-only execution boundaries and never exposed to public bundles or client environments
  Owner: Engineering Team
- Database schema drift causing client queries to fail at runtime due to stale type definitions
  Mitigation: Implement automated type generation pipelines tied to database schema migration checks
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
- Initialize client instances via createClient using centralized runtime configuration helpers rather than reading raw process environment variables at call sites
- Bind generated database schema contracts as generic type arguments to client instantiation functions to guarantee type safety for all downstream query builders
- Isolate administrative client instances with privileged service credentials strictly within secure server execution boundaries

## Continuation Context


Verify commands:
- Discover and execute the project type-checking script to validate that all client queries conform to database schema types
- Discover and execute the project linting and static analysis suite to verify no unauthorized direct database HTTP calls exist
- Discover and execute the automated test suite to confirm database query modules operate as expected with client abstractions

Accept when:
- All database and backend service queries authenticate and execute through client instances created using the adopted library API
- No direct raw HTTP requests bypass client boundary abstractions for operations supported by the client SDK
- Static type checking validates that client query operations conform to generated project database type contracts

## Enforcement

- Verified by: Static analysis checks in continuous integration verifying all database operations use authorized client interfaces
- Verified by: Automated lint checks blocking unvetted network fetch calls to database service URLs
- Verified by: Peer review on changes introducing database queries or external service credentials
- Violation handling: Pull requests introducing direct untyped backend database calls or alternative clients are blocked
- Violation handling: Violations discovered in audit trigger remediation tasks to refactor handlers to the standard client interface
- Violation handling: Unauthorized usage of administrative credentials triggers immediate security review and credential rotation
- Exception process: Submit an architectural exception request detailing runtime constraints that prevent using the standard client abstraction
- Exception process: Security review must evaluate manual authentication and transport handling before an exception is approved
- Exception process: Temporary exceptions must record a migration ticket with an explicit expiration milestone