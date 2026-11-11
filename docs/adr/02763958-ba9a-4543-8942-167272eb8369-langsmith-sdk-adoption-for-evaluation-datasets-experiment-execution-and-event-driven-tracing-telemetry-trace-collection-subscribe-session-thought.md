---
version: 2
name: 02763958-ba9a-4543-8942-167272eb8369-langsmith-sdk-adoption-for-evaluation-datasets-experiment-execution-and-event-driven-tracing-telemetry-trace-collection-subscribe-session-thought
description: "LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Telemetry Trace Collection Subscribe Session Thought"
metadata:
  actual:
    adr_id: 02763958-ba9a-4543-8942-167272eb8369
    status: accepted
    candidate_group_id: ded5e24f-ce67-493e-940e-d226792e5648
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/evaluation/**
---

# LangSmith SDK Adoption for Evaluation Datasets, Experiment Execution, and Event-Driven Tracing: Telemetry Trace Collection Subscribe Session Thought

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/evaluation/**`

## Context

- The platform requires structured evaluation capabilities, dataset management, and trace collection to assess agent performance across lifecycles.
- Direct dependency on external evaluation services introduces network latency and availability risks that could compromise core execution if not properly isolated.
- A unified client abstraction with defensive execution boundaries and circuit-breaker patterns was introduced across the evaluation subsystem to ensure resilience.

## Problem Statement

Agent workflows and reasoning traces require continuous evaluation and observability against benchmark datasets without subjecting core runtime execution to external network failures, API latency, or service interruptions from third-party evaluation providers.

## Decision

1. MUST: Telemetry and trace collection MUST subscribe to session and thought runtime events asynchronously and decouple trace persistence from application state transitions.

## Policy Block

- MUST Telemetry and trace collection MUST subscribe to session and thought runtime events asynchronously and decouple trace persistence from application state transitions.

In scope:
- All components within the evaluation subsystem responsible for client management, dataset synchronization, experiment runs, and trace telemetry.
- Event-driven listeners capturing thought and session lifecycle events for evaluation purposes.

Out of scope:
- Core runtime state management and business logic components that operate independently of evaluation telemetry.
- Local logging and internal diagnostics unrelated to external evaluation platforms.

Exceptions:
- EXC-20-001: Offline test harnesses and unit tests where mock client implementations or disabled telemetry configurations are explicitly required.

## Rationale

- Centralizing evaluation interactions through a dedicated client library provides consistent schema modeling and experiment runners across datasets.
- Wrapping client calls with defensive execution wrappers ensures that remote service errors degrade gracefully by returning safe fallbacks rather than terminating agent execution.
- Implementing circuit breakers within event-driven trace listeners protects the event bus from unbounded failure cascades and repetitive remote network timeouts.

## Consequences

Positive:
- Standardizes experiment running, dataset management, and trace telemetry around a consistent platform interface.
- Guarantees runtime fault tolerance by isolating primary execution loops from remote evaluation failures via defensive fallbacks and circuit breakers.
- Enables decoupled, asynchronous telemetry capture across session and thought lifecycles without blocking execution.

Negative:
- Requires maintaining defensive execution wrappers and fallback mechanisms across all evaluation entry points.
- Circuit breaker suppression during persistent outages results in uncaptured telemetry traces for the duration of the cooldown period.
- Couples the evaluation subsystem to the specific lifecycle models and schemas of the adopted SDK.

## Alternatives

- Custom in-house evaluation and tracing framework using raw network requests (rejected)
  Rejected because: Re-implementing dataset management, experiment execution routines, and trace visualization schemas introduces substantial development overhead and slows feature velocity.
  When valid: When strict air-gapped network restrictions prohibit external client libraries or when proprietary evaluation protocols are required.
- Direct unbuffered synchronous calls to evaluation endpoints without circuit breakers or fallback handlers (rejected)
  Rejected because: Exposes core agent execution loops to third-party network latency, rate limits, and service downtime.
  When valid: In non-critical batch processes where any remote failure is intended to halt the entire execution run immediately.

## Risks

- Trace omission during circuit breaker cooldown periods may lead to gaps in telemetry datasets.
  Mitigation: Emit diagnostic warnings indicating the suppression duration and monitor failure counts to adjust cooldown thresholds.
  Owner: Engineering Team
- Uninitialized client instances or invalid credentials could silently return fallback values without surfacing configuration issues.
  Mitigation: Log explicit warning messages when the client is uninitialized or when operations invoke fallbacks.
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
- Instantiate the client as a configured singleton and supply it to dataset managers, experiment runners, and trace listeners.
- Ensure every public method communicating with remote evaluation endpoints is guarded by the defensive execution helper returning a type-safe fallback value.
- Configure circuit breaker parameters including consecutive failure thresholds and cooldown durations to balance resilience with trace completeness.

## Continuation Context


Verify commands:
- echo 'Discover and execute project test suite for evaluation modules'; exit 0
- echo 'Discover dependency lock artifact and verify resolved client SDK version'; exit 0
- echo 'Discover static analysis and linter scripts to validate defensive wrapper typing'; exit 0

Accept when:
- All evaluation unit and integration test suites pass successfully under test environments.
- Defensive wrapper tests confirm that rejected client operations resolve to designated fallback values without unhandled rejections.
- Trace listener circuit breaker tests confirm that exceeding the failure threshold suppresses remote emissions for the duration of the cooldown period.

## Enforcement

- Verified by: Continuous integration test pipelines executing automated unit and integration tests for the evaluation subsystem.
- Verified by: Peer code reviews verifying that all evaluation client calls utilize defensive wrappers and that telemetry listeners maintain circuit breakers.
- Violation handling: Pull requests introducing unguarded evaluation client calls or lacking circuit-breaker protections will be rejected.
- Violation handling: Uncaught exceptions originating from evaluation or telemetry components trigger immediate remediation to restore defensive boundaries.
- Exception process: Submit an architectural review request detailing the necessity for bypassing defensive execution handlers or using alternative client configurations.
- Exception process: Obtain approval from the technical lead prior to merging modifications that alter evaluation fault-tolerance boundaries.