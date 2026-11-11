---
version: 2
name: 126f7aa4-a990-4236-a5e6-2be75188cd28-supabase-realtime-client-integration-for-postgres-change-data-capture-realtime-channel-subscriptions-postgres-changes-define
description: "Supabase Realtime Client Integration for Postgres Change Data Capture: Realtime Channel Subscriptions Postgres Changes Define"
metadata:
  actual:
    adr_id: 126f7aa4-a990-4236-a5e6-2be75188cd28
    status: accepted
    candidate_group_id: 1a2171d0-fa85-4901-a709-04f62c62ed41
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/lib/session/**
---

# Supabase Realtime Client Integration for Postgres Change Data Capture: Realtime Channel Subscriptions Postgres Changes Define

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`
- `src/lib/session/**`

## Context

- Client-side session management requires immediate reflection of database mutations across collaborative sessions.
- Static polling architectures introduce excessive database load and latency gaps for reactive user interfaces.
- Client modules use managed realtime channel subscriptions listening for change data capture events on relational tables.

## Problem Statement

Client components requiring synchronized session state must capture database mutations in real time without incurring the latency and server load of continuous polling.

## Decision

1. MUST: Realtime channel subscriptions for postgres_changes MUST define explicit event filtering by schema, table, and tenant identifier to prevent cross-tenant data leakage.

## Policy Block

- MUST Realtime channel subscriptions for postgres_changes MUST define explicit event filtering by schema, table, and tenant identifier to prevent cross-tenant data leakage.

In scope:
- Client-side modules and hooks requiring live synchronization with database table updates.

Out of scope:
- Static read-only views where data does not mutate during active user sessions.
- Local user interface interactions and canvas event handling.

## Rationale

- Direct database change broadcasting via Supabase realtime channels enables low-latency updates for collaborative views without periodic polling overhead.
- Scoped schema, table, and workspace filtering at the channel level minimizes client-side data transfer and enforces tenancy isolation boundaries.
- Integrating subscription lifecycles directly into component state hooks ensures reactive local cache synchronization while preserving component encapsulation.

## Consequences

Positive:
- Sub-second synchronization of database mutations directly into client component state.
- Reduced server load by replacing polling loops with push-based WebSocket change events.
- Deterministic state updates through structured payload mapping and idempotent record deduplication.

Negative:
- Increased client memory and connection overhead per open realtime channel.
- Potential state inconsistency if network disconnections cause dropped change events without resynchronization.
- Tight coupling between database table schema events and client view-model mapping logic.

## Alternatives

- Short-interval HTTP polling for table changes (rejected)
  Rejected because: Generates excessive network traffic and server query load while introducing latency proportional to the polling interval.
  When valid: When operating in environments where persistent WebSocket connections are blocked by network proxies.
- Server-Sent Events through custom backend integration endpoints (rejected)
  Rejected because: Requires maintaining custom event streaming infrastructure and replication listener services instead of using the managed database change broadcaster.
  When valid: When custom authorization transformations or event aggregation must be computed server-side prior to client dispatch.

## Risks

- Silent channel disconnection or stale client state following network sleep or resume events.
  Mitigation: Implement status callback observers on channel subscription states to trigger data refetching upon reconnection.
  Owner: Frontend engineering team
- Duplicate or out-of-order event delivery causing inconsistent local array ordering or double-insertions.
  Mitigation: Enforce idempotent state insertion checks and sort key validations in payload handling functions.
  Owner: Frontend engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Channel event handlers should execute state transformations using pure mapping functions to avoid race conditions when rapid database updates occur.
- Subscriptions should monitor connection status transitions and provide appropriate user feedback or reconnection handling during network disruptions.

## Continuation Context


Verify commands:
- Discover and execute the project test runner to verify that realtime event subscription and channel teardown tests pass.
- Discover and execute the project static analysis and type checking scripts to ensure that channel event payloads conform to domain view-model contracts.

Accept when:
- Realtime subscriptions establish connections and receive change events matching the specified table and filter criteria.
- Channel teardown cleanly unsubscribes without memory leaks or dangling event listeners upon component unmount.
- All discovered test suites and type verification scripts pass without errors.

## Enforcement

- Verified by: Automated code review verifying channel subscription teardown in client hook lifecycles.
- Verified by: Integration tests validating realtime channel event payload handling and idempotency.
- Violation handling: Pull requests containing untracked or non-filtered realtime subscriptions are blocked during review.
- Violation handling: Missing channel unsubscribe routines must be corrected prior to merging.
- Exception process: Exceptions must be submitted via architectural review with documented justification for alternative event-driven or polling mechanisms.