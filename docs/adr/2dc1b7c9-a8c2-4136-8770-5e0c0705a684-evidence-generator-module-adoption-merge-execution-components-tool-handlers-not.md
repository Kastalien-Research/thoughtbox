---
version: 2
name: 2dc1b7c9-a8c2-4136-8770-5e0c0705a684-evidence-generator-module-adoption-merge-execution-components-tool-handlers-not
description: "Evidence Generator Module Adoption: Merge Execution Components Tool Handlers Not"
metadata:
  actual:
    adr_id: 2dc1b7c9-a8c2-4136-8770-5e0c0705a684
    status: accepted
    candidate_group_id: 032c6665-47d9-40fe-972a-7085ddf511ec
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge/**
---

# Evidence Generator Module Adoption: Merge Execution Components Tool Handlers Not

Status: proposed
Date: 2025-05-14
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/merge/**`

## Context

- Merge handling and merge tool dispatching require generating structured evidence artifacts to record operation outcomes, session context, and merge states.
- Multiple handler layers within the merge domain interact with shared domain types and operation records during workflow execution.
- Adopting a dedicated internal evidence-generator module centralizes artifact construction and separates evidence logic from merge coordination.

## Problem Statement

Decentralized or inline construction of merge evidence artifacts across distinct handler components risks inconsistent audit structures, fragmented provenance tracking, and tight coupling of evidence formatting with merge execution logic.

## Decision

1. MUST_NOT: Merge execution components and tool handlers MUST NOT construct, format, or serialize evidence artifacts inline within workflow dispatch logic.

## Policy Block

- MUST_NOT Merge execution components and tool handlers MUST NOT construct, format, or serialize evidence artifacts inline within workflow dispatch logic.

In scope:
- All merge workflow handlers, merge tool handlers, and merge coordination modules requiring audit or evidence artifact generation.

Out of scope:
- Unrelated system domains that do not participate in merge operations or merge tool execution.
- Low-level utility helpers that do not produce audit records or persistent evidence.

Exceptions:
- EXC-20-001: Diagnostic or mock testing harnesses require synthesized fixture evidence without invoking module dependencies.

## Rationale

- Centralizing evidence generation into a shared internal module ensures uniform audit trail structures across direct merge execution and tool-based merge invocations.
- Decoupling evidence generation logic from merge handlers reduces cognitive complexity and keeps merge coordination focused on lifecycle management.
- Reusing domain type contracts within the evidence-generator ensures compile-time type safety across handler and tool boundaries.

## Consequences

Positive:
- Standardized audit and evidence structures across all merge entry points.
- Isolated evidence synthesis logic that can evolve independently of merge execution handlers.
- Reduced code duplication between direct merge handlers and tool dispatch handlers.

Negative:
- Introduces module coupling between all merge handlers and the evidence-generator module.
- Requires changes to the evidence module interface to be coordinated across multiple calling handlers.

## Alternatives

- Inline evidence construction within individual merge handlers and tool handlers (rejected)
  Rejected because: Leads to fragmented schema definitions, duplicated serialization logic, and inconsistent audit trails across handlers.
  When valid: Single-use prototype scripts with no audit or repeatability requirements.
- External third-party audit logging framework (rejected)
  Rejected because: Introduces heavy runtime dependencies and configuration overhead for domain-specific merge evidence requirements.
  When valid: Cross-service enterprise telemetry across distributed polyglot architectures.

## Risks

- Breaking interface changes in the evidence-generator module could impact multiple merge workflows simultaneously.
  Mitigation: Enforce strict domain type contracts and automated contract testing across all consumer handlers.
  Owner: engineering team
- Performance overhead if evidence generation performs synchronous or expensive operations during critical merge paths.
  Mitigation: Design evidence creation interfaces for efficient serialization and deferred or asynchronous processing where feasible.
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
- Implement the evidence-generator interface as pure functions or stateless services that accept validated operation payloads and return structured evidence objects.
- Coordinate evidence generator invocation with transaction boundaries to ensure evidence accurately reflects committed merge operations.

## Continuation Context


Verify commands:
- Discover and execute the project test suite covering merge handlers and evidence generation to verify integration correctness.
- Discover and execute the repository static analysis and type checking suite to verify contract compliance between handlers and the evidence module.
- Discover and execute the repository module boundary linting or dependency validation checks to ensure no inline evidence generation exists.

Accept when:
- All merge handler and tool handler test suites pass with evidence generated via the shared evidence module.
- Static type checking confirms all evidence records adhere to domain type definitions without type assertions.
- Code analysis verifies no direct evidence formatting or synthesis occurs outside the evidence module.

## Enforcement

- Verified by: Continuous integration automated test suite execution
- Verified by: Static type analysis and module boundary linting in build pipelines
- Verified by: Peer review of merge handler and tool handler modifications
- Violation handling: Build pipeline rejection for type mismatches or unapproved module imports
- Violation handling: Mandatory code review remediation before merging code that constructs evidence inline
- Exception process: Submit an architectural exception request detailing the necessity of bypassing the shared evidence module, approved by the merge subsystem lead.