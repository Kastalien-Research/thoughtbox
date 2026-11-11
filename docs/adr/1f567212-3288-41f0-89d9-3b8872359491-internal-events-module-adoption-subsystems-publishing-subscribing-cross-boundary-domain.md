---
version: 2
name: 1f567212-3288-41f0-89d9-3b8872359491-internal-events-module-adoption-subsystems-publishing-subscribing-cross-boundary-domain
description: "Internal Events Module Adoption: Subsystems Publishing Subscribing Cross Boundary Domain"
metadata:
  actual:
    adr_id: 1f567212-3288-41f0-89d9-3b8872359491
    status: accepted
    candidate_group_id: 1030c3c6-d894-429c-97f9-79735a145c16
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/claims/**
      - src/evaluation/**
---

# Internal Events Module Adoption: Subsystems Publishing Subscribing Cross Boundary Domain

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/claims/**`
- `src/evaluation/**`

## Context

- Subsystems across the codebase require decoupled notification mechanisms to communicate domain state transitions and lifecycle milestones without direct point-to-point compile-time coupling.
- Evaluation monitors, observability trace listeners, and domain claim handlers must observe runtime transitions such as session milestones and mutation events asynchronously.
- Direct synchronous cross-module invocations introduce tight coupling, circular dependency risks, and operational fragility when auxiliary listeners experience transient execution failures.
- An internal events module has been introduced to establish a centralized event publishing and subscription interface across distinct subsystem boundaries.

## Problem Statement

Cross-domain components require a standardized, decoupled mechanism to communicate lifecycle events and state transitions without introducing bidirectional dependencies or causing runtime failures in primary workflows when auxiliary subscribers encounter errors.

## Decision

1. MUST: Subsystems publishing or subscribing to cross-boundary domain lifecycle occurrences MUST communicate exclusively through the internal events module interface rather than establishing direct synchronous inter-module dependencies.

## Policy Block

- MUST Subsystems publishing or subscribing to cross-boundary domain lifecycle occurrences MUST communicate exclusively through the internal events module interface rather than establishing direct synchronous inter-module dependencies.

In scope:
- Subsystems and domain modules requiring asynchronous event distribution, lifecycle notifications, or cross-cutting listener attachment.

Out of scope:
- Synchronous transactional operations requiring immediate ACID consistency or two-phase commits within an isolated single-module datastore boundary.

Exceptions:
- EX-20-001: A module requires direct in-process synchronous invocation for atomic transactions where intermediate event dispatching compromises transaction isolation.

## Rationale

- Evidence demonstrates consistent integration of the internal events module across evaluation pipelines, tracing subscribers, and domain handlers, confirming its role as the shared messaging backbone.
- Decoupling publishers from subscribers through an internal event bus prevents secondary concerns such as observability tracing from blocking primary domain operations.
- Standardizing on an internal event emitter abstraction provides a uniform subscription pattern across diverse subsystems while maintaining clear architectural boundaries.

## Consequences

Positive:
- Subsystems operate with loose coupling, allowing publishers and subscribers to evolve independently.
- Auxiliary concerns such as tracing and telemetry attach to domain events without modifying core domain logic.
- Elimination of direct compile-time inter-module dependencies prevents circular imports across domain services.

Negative:
- Asynchronous event flows increase cognitive overhead when tracing end-to-end execution paths during debugging.
- Event publishers cannot directly receive synchronous return values or acknowledgments from subscribers without additional coordination primitives.
- Failure to clean up event listeners risks memory leaks through retained object references.

## Alternatives

- Direct synchronous method invocation between subsystem modules (rejected)
  Rejected because: Creates tight bidirectional coupling between domain handlers and auxiliary observability consumers, risking cascading failures.
  When valid: When operations require immediate synchronous results and atomic transactional consistency.
- Adoption of an external distributed message broker (deferred)
  Rejected because: Introduces external operational infrastructure and latency overhead unnecessary for in-process module communication.
  When valid: When event consumers must scale independently across distributed multi-process infrastructure.

## Risks

- Unbounded listener retention leading to memory leaks across long-lived event emitters.
  Mitigation: Enforce explicit unsubscription and session cleanup logic whenever session contexts terminate.
  Owner: Engineering team
- Slow or failing event subscribers blocking or degrading event emission performance.
  Mitigation: Implement circuit breaker patterns, timeout safeguards, and error isolation within event handlers.
  Owner: Engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Consumers must verify that all registered event handlers properly deregister when lifecycle sessions conclude.
- Subscribers that interface with external networks or secondary storage should encapsulate operations within protective error boundaries to preserve emitter execution continuity.

## Continuation Context


Verify commands:
- Discover and run the project's test suite verification script to ensure all event publishing and subscriber test suites pass.
- Discover and run the project's static analysis and type check scripts to verify event payload contract conformance across module boundaries.

Accept when:
- All unit and integration tests covering event emission and subscription pass successfully.
- Static type analysis confirms zero type errors across event registration and listener payload signatures.

## Enforcement

- Verified by: Automated continuous integration pipeline executing test suites and static analysis checks.
- Verified by: Architectural and peer code review verifying adherence to decoupled event communication rules.
- Violation handling: Direct synchronous cross-domain coupling in pull requests must be rejected during code review.
- Violation handling: Uncaught subscriber exceptions or omitted event listener cleanup must be treated as release-blocking defects.
- Exception process: Exceptions require documented architectural review detailing why asynchronous event communication is unsuitable and establishing alternative isolation guarantees.