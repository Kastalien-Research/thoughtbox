---
version: 2
name: ee3fb83e-90b7-49c6-a570-f1e0f5df2e5d-langsmith-client-adoption-with-safe-fallback-execution-middleware-evaluation-modules-not-invoke-remote-langsmith
description: "LangSmith Client Adoption with Safe Fallback Execution Middleware: Evaluation Modules Not Invoke Remote Langsmith"
metadata:
  actual:
    adr_id: ee3fb83e-90b7-49c6-a570-f1e0f5df2e5d
    status: accepted
    candidate_group_id: 65cde823-dca7-4092-9d32-d1f3ce786438
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# LangSmith Client Adoption with Safe Fallback Execution Middleware: Evaluation Modules Not Invoke Remote Langsmith

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/**`

## Context

- The evaluation subsystem requires structured dataset tracking, experiment runs, and schema management across evaluation workflows.
- Integration with external tracking backends introduces network latency, availability concerns, and dependency on optional runtime configuration credentials.
- Direct invocation of external client SDK methods without defensive isolation risks propagating unhandled exceptions through evaluation routines when credentials are not configured or external endpoints fail.
- A standardized protective boundary middleware pattern encapsulates client availability checks, error interception, warning logging, and fallback data resolution.

## Problem Statement

External evaluation and tracking platforms provide dataset management and experiment recording, but reliance on direct client SDK calls creates brittle execution paths when external services experience transient network failures, rate limiting, or when API credentials are unconfigured in local environments. Without a uniform execution boundary, unhandled client exceptions terminate evaluation runs prematurely, and components duplicate inconsistent error handling and fallback logic.

## Decision

1. MUST_NOT: Evaluation modules MUST NOT invoke remote LangSmith SDK methods directly without wrapping the execution inside the safe boundary middleware.

## Policy Block

- MUST_NOT Evaluation modules MUST NOT invoke remote LangSmith SDK methods directly without wrapping the execution inside the safe boundary middleware.

In scope:
- Evaluation modules, dataset managers, and experiment runners that integrate with external evaluation and dataset tracking services.
- Internal services that perform asynchronous network operations against LangSmith client endpoints.

Out of scope:
- Core local processing pipelines that do not interface with external evaluation or telemetry APIs.
- Critical infrastructure persistence where silent fallback would corrupt canonical state and hard errors are required.

Exceptions:
- EXC-24-001: An evaluation operation explicitly requires strict remote verification and must abort the workflow if tracking cannot be established.

## Rationale

- Encapsulating LangSmith client calls within a safe execution boundary prevents unconfigured environments or transient network disruptions from halting evaluation workflows.
- Standardizing the safe boundary pattern across dataset management and experiment execution provides consistent fallback semantics, uniform diagnostic logging, and reduced code duplication.
- Checking client instantiation upfront allows the evaluation subsystem to run in headless or offline environments where external API credentials are not provided.

## Consequences

Positive:
- Evaluation pipelines remain resilient against external service outages, network latency, and missing configuration credentials.
- Uniform logging and fallback semantics across evaluation components eliminate divergent error-handling logic and simplify diagnostics.
- Local development and automated test suites can execute evaluation workflows in offline or unconfigured environments without requiring live external platform access.

Negative:
- Suppression of external operational errors behind fallback values may mask integration defects or configuration misalignments if warning logs are ignored.
- Calling components must define appropriate fallback representations for every external client operation, introducing minor interface overhead.

## Alternatives

- Direct unhandled client SDK invocations across evaluation components (rejected)
  Rejected because: Exposes evaluation workflows to unhandled runtime exceptions whenever credentials are unconfigured or external network endpoints fail, creating fragile execution pipelines.
  When valid: Valid only in isolated test harnesses specifically asserting that raw client exceptions are propagated.
- Out-of-process HTTP proxy or global network interceptor for evaluation telemetry (rejected)
  Rejected because: Introduces external operational complexity and cannot provide type-safe, caller-specific fallback values tailored to individual evaluation operations.
  When valid: Valid when managing centralized multi-tenant egress proxying across heterogeneous non-SDK services.

## Risks

- Silent fallback behavior could lead engineers to assume evaluation data is successfully recorded when requests are failing or credentials are misconfigured.
  Mitigation: Ensure warning logs include distinct operation labels and error messages, and monitor log outputs during automated testing and experiment validation.
  Owner: Evaluation and telemetry engineering team
- Incompatible API changes across minor version upgrades of the client SDK breaking parameter structures.
  Mitigation: Enforce strict dependency lockfile grounding and verify SDK interface signatures before modifying client call sites.
  Owner: Platform architecture team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Implement the safe wrapper as an internal boundary helper method accepting an operation label, a fallback return value, and an asynchronous execution callback.
- Ensure client initialization checks evaluate whether the underlying client instance is truthy prior to initiating any SDK method calls.

## Continuation Context


Verify commands:
- Discover and run the project test suite covering evaluation modules to verify safe execution boundary fallback behavior.
- Discover and execute the project static analysis and type-checking scripts to verify that all LangSmith client calls conform to the required boundary signature.
- Discover and inspect the project dependency lock artifact to confirm the resolved client library version matches the documented API surface.

Accept when:
- All automated test suites for evaluation dataset management and experiment execution pass when the external client is unconfigured, confirming that fallback values are returned without throwing unhandled exceptions.
- Static analysis and type checking scripts complete without diagnostic errors across all evaluation service call sites.
- Execution logs capture structured diagnostic warnings containing the expected operation label and error details when external service operations fail.

## Enforcement

- Verified by: Automated test suites executing evaluation scenarios with both configured and unconfigured client states.
- Verified by: Pull request code reviews inspecting evaluation modules to ensure direct client invocations are encapsulated within safe fallback boundaries.
- Verified by: Static analysis checks detecting uncaught promise rejections or raw client method invocations outside boundary helpers.
- Violation handling: Pull requests containing direct, unguarded client SDK calls without fallback protection are blocked from merging.
- Violation handling: Identified unhandled client exceptions in evaluation flows are flagged as high-priority reliability bugs.
- Exception process: Submit an architectural exception request detailing why an evaluation workflow must fail catastrophically rather than degrade gracefully, subject to review by the domain lead.