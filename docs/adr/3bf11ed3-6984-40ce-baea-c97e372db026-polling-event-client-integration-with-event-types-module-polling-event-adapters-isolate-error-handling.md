---
version: 2
name: 3bf11ed3-6984-40ce-baea-c97e372db026-polling-event-client-integration-with-event-types-module-polling-event-adapters-isolate-error-handling
description: "Polling Event Client Integration with event-types Module: Polling Event Adapters Isolate Error Handling"
metadata:
  actual:
    adr_id: 3bf11ed3-6984-40ce-baea-c97e372db026
    status: accepted
    candidate_group_id: d6b817ed-9fc0-4473-a594-c5e736f863a4
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Polling Event Client Integration with event-types Module: Polling Event Adapters Isolate Error Handling

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `plugins/thoughtbox-claude-code`

Applies to:
- `src/**`

## Context

- External remote platform services frequently expose only REST endpoints requiring periodic polling rather than real-time push webhooks or persistent socket streams.
- Downstream application components require decoupled, event-driven notifications to react to remote updates without embedding polling loops or pagination state management.
- The codebase establishes an integration boundary that encapsulates cursor-based HTTP fetching and translates external record batches into domain events conforming to the event-types module contract.

## Problem Statement

Directly coupling domain components to external REST polling logic causes distributed cursor tracking, redundant network calls, and tight binding to external pagination protocols. An integration pattern is required to encapsulate cursor-based fetching, authentication, and pagination while presenting a clean event-driven boundary to internal consumers.

## Decision

1. SHOULD: Polling event adapters SHOULD isolate error handling during external fetch invocations to prevent ingestion failure from disrupting active event subscription listeners.

## Policy Block

- SHOULD Polling event adapters SHOULD isolate error handling during external fetch invocations to prevent ingestion failure from disrupting active event subscription listeners.

In scope:
- Integration adapters and external client boundaries that ingest remote state updates via cursor-based HTTP polling
- Event emitter services translating remote REST endpoint records into domain event streams

Out of scope:
- Internal inter-service messaging utilizing native message brokers or direct event emitters
- Inbound push integration interfaces such as webhooks or persistent bidirectional sockets

## Rationale

- Encapsulating HTTP fetch calls within a polling client isolates cursor progression, authorization headers, and page limits from core domain business logic.
- Emitting strongly typed event payloads based on the event-types module normalizes remote data representations into internal event contracts.
- Providing an event emitter interface allows multiple downstream listeners to react asynchronously to remote state changes without synchronizing on polling intervals.

## Consequences

Positive:
- Downstream domain consumers remain cleanly decoupled from external API transport details and polling schedules.
- Cursor and session state tracking is centrally managed within the integration adapter.
- Event payloads conform to standardized contracts defined in the event-types module.

Negative:
- Polling introduces inherent latency between remote state mutations and local event emissions based on poll intervals.
- Unmanaged polling cycles risk consuming external API rate limits or incurring unnecessary network overhead during idle periods.

## Alternatives

- Direct polling by domain consumers (rejected)
  Rejected because: Distributes cursor management, query parameter formatting, and authentication headers across multiple domain layers, violating separation of concerns.
  When valid: Valid only in standalone utility scripts where decoupled event architecture introduces unnecessary indirection.
- Inbound push webhook listener (deferred)
  Rejected because: The external service does not provide push webhooks or the hosting environment does not expose public ingress endpoints.
  When valid: Valid when external providers support authenticated webhook callbacks and infrastructure supports secure ingress.

## Risks

- External API rate limiting or temporary network downtime could disrupt polling cycles and stall cursor progression.
  Mitigation: Implement backoff strategies and error boundaries around HTTP fetch calls while retaining the last valid cursor state.
  Owner: Integration Engineering Team
- Schema drift between external payloads and event-types definitions could cause emission of invalid events.
  Mitigation: Enforce contract validation at the ingestion boundary before emitting events to internal listeners.
  Owner: Integration Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Ensure cursor updates occur only after successful fetch responses and event emissions to prevent dropped events on failure.
- Configure authorization headers and session parameters via client configuration abstractions rather than hardcoded credentials.

## Continuation Context


Verify commands:
- Discover and execute the project integration test suite targeting the polling event adapter to verify cursor progression and event emission.
- Discover and execute the static type checking and linting tasks defined in the workspace scripts to validate contract compliance with the event-types module.

Accept when:
- Integration tests confirm that external fetch invocations correctly update cursor query parameters and trigger expected event emissions.
- Static analysis and test suites pass with zero errors across all boundary adapters.

## Enforcement

- Verified by: Automated continuous integration pipeline executing unit and integration test suites.
- Verified by: Pull request architectural code reviews verifying encapsulation of polling logic.
- Violation handling: Pull requests with domain code directly calling external polling endpoints or omitting event-types contracts are blocked from merging.
- Violation handling: Violations must be refactored into designated boundary adapters emitting standardized events.
- Exception process: Exceptions require written approval from the integration architecture team and must be documented with an architectural exception ticket explaining why event-driven decoupling cannot be applied.