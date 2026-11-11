---
version: 2
name: f6c73d02-17bf-4f54-b8e1-474f8557ceb3-supabase-supabase-js-stateless-client-pattern-for-primary-datastores-primary-datastore-access-across-backend-storage
description: "@supabase/supabase-js Stateless Client Pattern for Primary Datastores: Primary Datastore Access Across Backend Storage"
metadata:
  actual:
    adr_id: f6c73d02-17bf-4f54-b8e1-474f8557ceb3
    status: accepted
    candidate_group_id: 89678a68-6d50-4361-9385-767b19f8de11
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/**
---

# @supabase/supabase-js Stateless Client Pattern for Primary Datastores: Primary Datastore Access Across Backend Storage

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `scripts/**`
- `src/**`

## Context

- Primary datastore operations across backend repositories and protocol handlers require direct database communication using elevated service-role privileges.
- Default client configurations in the database library assume browser contexts that attempt to store session tokens in local storage and maintain background refresh intervals.
- Uncoordinated client creation in long-running services and serverless runtimes risks resource exhaustion and unpredictable session persistence behavior across tenant boundaries.

## Problem Statement

Backend services, claim stores, and runbook storage modules require reliable communication with the primary datastore without inheriting client-side session lifecycle mechanics. Instantiating unconfigured clients causes persistent auth polling, unnecessary background timer allocations, and cross-request state bleeding in multi-tenant daemon and server processes.

## Decision

1. MUST: Primary datastore access across backend storage adapters, repositories, and protocol handlers MUST use @supabase/supabase-js initialized through createClient configured with stateless session options setting auth persistSession to false and auth autoRefreshToken to false.

## Policy Block

- MUST Primary datastore access across backend storage adapters, repositories, and protocol handlers MUST use @supabase/supabase-js initialized through createClient configured with stateless session options setting auth persistSession to false and auth autoRefreshToken to false.

In scope:
- Backend storage services, repositories, protocol handlers, and probe monitors communicating with primary datastores.
- Components instantiating primary datastore clients using service-role credentials in non-browser environments.

Out of scope:
- End-user interactive client applications requiring persistent browser session authentication.
- Local embedded storage adapters using direct filesystem database engines.

Exceptions:
- EXC-28-001: A module requires interactive user-session persistence in an interactive client environment.

## Rationale

- Configuring createClient with explicit auth suppression disabling session persistence and automatic token refresh prevents unintended token storage and background refresh intervals in headless server runtimes.
- Applying typed database contracts to client instances guarantees static verification of schema shapes and table access patterns across storage adapters.
- Memoizing storage instances in process-local lookup structures minimizes client initialization overhead during repeated operations across tenant partitions.

## Consequences

Positive:
- Eliminates background authentication timer leaks and invalid storage access attempts in headless execution contexts.
- Ensures strict isolation of service-role datastore requests across concurrent operations.
- Provides consistent client instantiation conventions across all backend persistence modules.

Negative:
- Requires manual tenant-scoped lifecycle management when storing client references in process memory.
- Prevents reuse of automatic token rotation mechanisms intended for long-lived user client sessions.

## Alternatives

- Rely on default client settings with browser authentication enabled (rejected)
  Rejected because: Default authentication behaviors attempt local storage access and spawn unneeded token refresh timers in server environments.
  When valid: Only in interactive single-page browser clients.
- Construct a new un-memoized client instance on every individual database call (rejected)
  Rejected because: Repeated instantiation introduces unnecessary connection setup latency and memory churn under high-throughput request cycles.
  When valid: Short-lived CLI scripts with a single execution boundary.

## Risks

- Unbounded growth of in-memory client and repository cache maps across distinct tenant workspaces.
  Mitigation: Enforce eviction strategies or scope cache lifetime to individual request contexts when tenant cardinality is high.
  Owner: Data Infrastructure Team
- Accidental exposure of elevated service credentials due to shared client instances across boundary lines.
  Mitigation: Restrict service-role client creation strictly to internal backend storage adapters.
  Owner: Security and Infrastructure Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- When instantiating datastore clients in backend services, pass explicit configuration disabling session persistence and token auto-refresh.
- Bind generated database type definitions directly to the client constructor to preserve compile-time schema validation across queries.

## Continuation Context


Verify commands:
- Discover the repository test runner from the project manifest and execute the test suites covering datastore client initialization and repository behavior.
- Discover and run the project static analysis and type check commands to verify that all primary datastore client usages adhere to typing and configuration constraints.

Accept when:
- All persistence adapter test suites pass without session persistence warnings or unhandled background timer rejections.
- Static verification confirms that primary datastore client calls pass explicit auth configuration and compile cleanly against database schemas.

## Enforcement

- Verified by: Automated static analysis and type verification in continuous integration pipelines.
- Verified by: Peer code review for all new and modified datastore adapters and repository implementations.
- Violation handling: Build rejection on continuous integration when unconfigured or untyped client initializations are detected.
- Violation handling: Required refactoring of datastore adapters prior to merge approval.
- Exception process: Formal request submitted to the architecture review board specifying technical rationale, security boundaries, and mitigation for session management.