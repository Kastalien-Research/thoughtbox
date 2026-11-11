---
version: 2
name: 472c2c8a-aa16-4a9f-b74a-1a6293da6eaa-adoption-of-lib-supabase-server-for-server-action-client-instantiation-server-action-handlers-performing-state-mutations
description: "Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Server Action Handlers Performing State Mutations"
metadata:
  actual:
    adr_id: 472c2c8a-aa16-4a9f-b74a-1a6293da6eaa
    status: accepted
    candidate_group_id: c9ae03f8-f61b-482e-b711-b3a0ae6c3a90
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Adoption of `@/lib/supabase/server` for Server Action Client Instantiation: Server Action Handlers Performing State Mutations

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`

## Context

- Server actions across workspace settings, account administration, and API key management require authenticated access to backend data and authentication providers.
- Direct instantiation of unconfigured or client-side database clients in server action scopes risks leaking credentials, bypassing server cookie handling, or dropping user session context.
- The internal module `@/lib/supabase/server` encapsulates server-side client instantiation via `createClient`, standardizing authenticated database and identity operations across server-side mutation routines.
- Mutation handlers coordinate server client interactions with cache layer invalidation to maintain consistency across server-rendered views.

## Problem Statement

Server-side mutation routines and server actions require authenticated database and identity access with correct server context, request cookie forwarding, and credential protection. Without a standardized server client module, mutation handlers risk inconsistent session resolution, credential leakage, or divergent client configuration across independent server action endpoints.

## Decision

1. SHOULD: Server action handlers performing state mutations SHOULD coordinate client operations with cache invalidation functions from `next/cache` to purge stale server-rendered data.

## Policy Block

- SHOULD Server action handlers performing state mutations SHOULD coordinate client operations with cache invalidation functions from `next/cache` to purge stale server-rendered data.

In scope:
- Server action handlers executing server-side mutations within workspace and account settings.
- Server-side mutation endpoints requiring authenticated database or identity operations.

Out of scope:
- Client-rendered UI components and client-side hooks operating within browser runtime environments.
- Public read-only endpoints and static asset delivery pipelines that do not execute server actions.

## Rationale

- Centralizing server-side client creation in `@/lib/supabase/server` guarantees that request headers, cookie jars, and session contexts are uniformly forwarded across all server actions.
- Evidence across workspace settings, account settings, and API key actions demonstrates consistent consumption of `createClient` from `@/lib/supabase/server`, proving established architectural consensus.
- Abstracting client instantiation behind an internal module isolates backend infrastructure configuration details from individual action handlers, simplifying future refactoring.

## Consequences

Positive:
- Uniform authentication session and cookie propagation across all workspace server action handlers.
- Elimination of redundant client setup and credential configuration logic across server mutation endpoints.
- Strong encapsulation of server runtime constraints and security boundaries within a centralized internal module.

Negative:
- Tight coupling of all server action handlers to the internal server module contract.
- Asynchronous client creation and context resolution add per-request overhead to server action executions.

## Alternatives

- Directly instantiating generic client instances within each server action handler (rejected)
  Rejected because: Duplicating client instantiation leads to inconsistent cookie extraction, fragmented session handling, and heightened exposure of server configuration variables across endpoints.
  When valid: Single-file prototype scripts that operate outside multi-tenant request-response server runtimes.
- Exposing a persistent global client singleton across all server requests (rejected)
  Rejected because: A global client singleton cannot safely isolate per-request user credentials or request-bound cookie headers in concurrent server execution environments.
  When valid: Long-running daemon processes that utilize fixed service-role credentials without user session context.

## Risks

- Breaking changes in the internal `@/lib/supabase/server` module interface immediately impact all dependent server action endpoints.
  Mitigation: Maintain a stable client creation contract and run automated integration test suites prior to modifying internal client exports.
  Owner: engineering team
- Failure to invalidate downstream caches after database mutations causes user interface state divergence.
  Mitigation: Enforce code review checklists ensuring mutation actions invoke appropriate cache invalidation functions alongside client calls.
  Owner: engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Import `createClient` from `@/lib/supabase/server` within server action scopes and await its client handle before dispatching authentication or data modification calls.
- Extract request input parameters from incoming form payloads and sanitize values prior to delegating data mutations to the initialized client.

## Continuation Context


Verify commands:
- Find the repository package manifest and execute the designated static analysis script to verify that server actions import client factories exclusively from the internal server library.
- Locate the project build configuration and run the type-checking routine to validate client method signatures across all server action modules.
- Execute the repository test suite to verify that server actions correctly instantiate server clients and execute database mutations without authentication context errors.

Accept when:
- Static analysis confirms zero unauthorized or direct third-party client instantiations across server action handlers.
- Type checking passes with zero diagnostics regarding client calls or exported action signatures.
- Automated server action integration tests pass with authenticated client sessions properly validated.

## Enforcement

- Verified by: Automated pull request linting and static analysis checks restricting direct client imports.
- Verified by: Peer code review verifying adherence to `@/lib/supabase/server` module usage in server actions.
- Verified by: Continuous integration test passes validating server action behavior.
- Violation handling: Pull requests containing unapproved client creation patterns or direct client-side imports in server actions are blocked from merging.
- Violation handling: Violations identified during code review must be refactored to consume `@/lib/supabase/server`.
- Exception process: Architectural exceptions require formal submission and sign-off by the lead engineering team with documented security justification.