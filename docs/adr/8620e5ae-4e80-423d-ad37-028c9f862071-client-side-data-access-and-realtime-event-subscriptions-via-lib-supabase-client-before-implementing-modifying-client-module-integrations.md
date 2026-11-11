---
version: 2
name: 8620e5ae-4e80-423d-ad37-028c9f862071-client-side-data-access-and-realtime-event-subscriptions-via-lib-supabase-client-before-implementing-modifying-client-module-integrations
description: "Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Before Implementing Modifying Client Module Integrations"
metadata:
  actual:
    adr_id: 8620e5ae-4e80-423d-ad37-028c9f862071
    status: accepted
    candidate_group_id: 37c95853-700a-4de9-af16-f7ebc39a4e5e
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/lib/session/**
---

# Client-Side Data Access and Realtime Event Subscriptions via @/lib/supabase/client: Before Implementing Modifying Client Module Integrations

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`
- `src/lib/session/**`

## Context

- Multiple client-rendered interface modules and hooks require direct data access and real-time state synchronization with backend data models.
- Components need a standardized mechanism to initialize client instances and register for change notifications without duplicating connection settings.
- Codebase evidence indicates widespread adoption of createClient from @/lib/supabase/client paired with channel subscription listeners.

## Problem Statement

Client-rendered components require coordinated access to persistent data and real-time database event streams. Without a centralized client module and structured subscription conventions, components risk duplicated configuration, uncoordinated channel lifecycles, and inconsistent state updates.

## Decision

1. MUST: Before implementing or modifying client module integrations, the consumer MUST inspect the repository lock artifact to resolve the exact dependency versions and confirm that invoked methods adhere to the documented interface.

## Policy Block

- MUST Before implementing or modifying client module integrations, the consumer MUST inspect the repository lock artifact to resolve the exact dependency versions and confirm that invoked methods adhere to the documented interface.

In scope:
- Client-rendered modules and hooks that interact with persistent database records or realtime change streams.
- Components executing within browser runtime boundaries requiring direct data synchronization.

Out of scope:
- Server-rendered components and backend service endpoints operating outside client browser contexts.
- Static presentation components that receive data exclusively via props.

## Rationale

- Evidence across client components shows uniform adoption of createClient from @/lib/supabase/client for data fetching and realtime subscriptions.
- Encapsulating client instantiation within a centralized module enforces consistent configuration and environment credential handling.
- Utilizing structured channel listeners with idempotent state updates guarantees reliable real-time interface synchronization.

## Consequences

Positive:
- Centralizes client configuration, authentication propagation, and connection initialization in a shared client module.
- Enables reactive real-time interface updates via declarative Postgres change subscription channels.
- Ensures consistent error and status handling across data access touchpoints.

Negative:
- Requires diligent client-side lifecycle management to prevent memory leaks and dangling socket connections.
- Ties client-side components to the availability and performance of persistent realtime channel infrastructure.

## Alternatives

- Direct third-party client construction in individual component files (rejected)
  Rejected because: Creates fragmented client configuration, duplicated authentication headers, and redundant connection pools across components.
  When valid: Admissible in isolated single-file demonstration prototypes with no shared state.
- Periodic HTTP polling from client components for state updates (rejected)
  Rejected because: Increases server request load and incurs latency delays compared to push-based Postgres change event channels.
  When valid: Valid when websocket connectivity is restricted or real-time event infrastructure is unavailable.

## Risks

- Unclosed realtime channel subscriptions leaking connections during component re-renders.
  Mitigation: Ensure cleanup routines unsubscribe active channels inside lifecycle unmount hooks.
  Owner: engineering team
- Unbounded state accumulation from duplicate realtime event delivery.
  Mitigation: Implement identity checks and deduplication in state update reducers prior to appending records.
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
- Encapsulate realtime channel subscriptions inside custom hooks that manage subscription lifecycle, status tracking, and teardown.
- Normalize incoming change payloads using view-model conversion functions before committing updates into React component state.

## Continuation Context


Verify commands:
- Discover and execute the repository static analysis script to verify module import constraints and ensure client factories are imported exclusively from the centralized client module.
- Discover and execute the repository test runner to validate that realtime subscription lifecycle and event handler behaviors execute without unhandled subscription rejections.

Accept when:
- Static analysis passes with zero import violations across all client-rendered modules.
- Automated test suites pass, confirming proper channel subscription initialization and cleanup on component unmount.

## Enforcement

- Verified by: Automated static analysis checks in continuous integration pipelines verifying module import paths.
- Verified by: Peer code review evaluating realtime channel lifecycle handling and idempotent state updates.
- Violation handling: Static analysis build failures on unapproved client instantiation or improper import paths.
- Violation handling: Pull request rejection requiring remediation of unmanaged channel subscriptions or duplicate client instantiations.
- Exception process: Submit an architectural review request detailing the necessity of custom client instantiation, reviewed and approved by lead maintainers.