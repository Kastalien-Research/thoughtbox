---
version: 2
name: 455fcd0f-f0e1-40ee-b0e9-125fa13ef527-langsmith-evaluation-and-experiment-tracking-library-adoption-evaluation-subsystem-adopt-langsmith-its-schema
description: "LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Subsystem Adopt Langsmith Its Schema"
metadata:
  actual:
    adr_id: 455fcd0f-f0e1-40ee-b0e9-125fa13ef527
    status: accepted
    candidate_group_id: 24daf34b-1fd7-4e4f-96ed-da0e6d818c7e
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/evaluation/**
---

# LangSmith Evaluation and Experiment Tracking Library Adoption: Evaluation Subsystem Adopt Langsmith Its Schema

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `scripts/**`
- `src/evaluation/**`

## Context

- The evaluation subsystem requires persistent dataset management, experiment run tracking, and structured metric evaluation across benchmark executions.
- Evaluation workflows require uniform schemas to record run metrics including execution duration, token consumption, and financial cost.
- Remote telemetry or service outages must not interrupt long-running benchmark runs or local model evaluations.

## Problem Statement

Without a standardized evaluation framework, benchmark instrumentation and experiment tracking risk fragmented schema definitions, inconsistent metric collection, and fragile remote reporting pipelines that abort evaluation runs when telemetry services encounter network or authentication failures.

## Decision

1. MUST: The evaluation subsystem MUST adopt LangSmith and its evaluation and schema modules as the standard library for experiment tracking, dataset management, and evaluation metric collection.

## Policy Block

- MUST The evaluation subsystem MUST adopt LangSmith and its evaluation and schema modules as the standard library for experiment tracking, dataset management, and evaluation metric collection.

In scope:
- Evaluation runners executing model benchmarks and experiments
- Scripts querying evaluation datasets and recording judge outputs
- Type definitions and schema contracts governing evaluation runs

Out of scope:
- Production inference runtime paths outside evaluation workflows
- Internal utility modules that do not interface with evaluation telemetry or benchmarking datasets

## Rationale

- Standardizing on LangSmith and its evaluation modules centralizes experiment tracking and dataset management across model iterations.
- Adopting shared evaluation schemas guarantees that execution durations, token metrics, and cost data follow consistent data contracts across evaluation scripts and runners.
- Encapsulating remote client requests in safe fallback handlers isolates benchmark runs from telemetry service downtime and network latency.

## Consequences

Positive:
- Standardizes experiment tracking and schema definitions across all evaluation workflows and benchmark runners.
- Improves benchmark suite resilience through defensive client invocation boundaries that isolate failures.
- Enables structured comparison of model outputs, durations, token counts, and operational costs across experiment runs.

Negative:
- Introduces a dependency on an external evaluation service and its schema conventions for experiment persistence.
- Requires credential configuration and network connectivity to record complete experiment datasets.

## Alternatives

- In-House Custom Evaluation and Logging Framework (rejected)
  Rejected because: Building proprietary dataset storage, run visualization, and evaluation schemas incurs ongoing maintenance overhead and lacks integration with ecosystem evaluation tooling.
  When valid: When air-gapped infrastructure strictly prohibits external telemetry dependencies or network-accessible experiment logging.
- Ad-Hoc Local File System JSON Logging (rejected)
  Rejected because: Unstructured local file writes lack centralized schema validation, comparative benchmark analysis capabilities, and experiment tracking abstractions.
  When valid: When running isolated single-execution scratchpad tests where cross-run persistence and schema consistency are unnecessary.

## Risks

- Missing or invalid telemetry credentials could result in unrecorded evaluation runs if fallback mechanisms silently mask client failures.
  Mitigation: Log diagnostic warnings when client credentials are missing or remote calls revert to fallback states.
  Owner: Engineering Team
- Breaking changes in upstream evaluation schema modules across version updates.
  Mitigation: Enforce lock-version grounding procedures and validate schema exports against locked dependency documentation.
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
- Configure client initialization through structured environment settings, providing explicit fallbacks when client instances cannot be initialized.
- Encapsulate remote client API invocations within reusable asynchronous error-boundary methods that capture and log service errors without raising uncaught exceptions.

## Continuation Context


Verify commands:
- Discover the project's dependency manifest and lock artifact, and verify that the evaluation library is declared and locked to a resolved release.
- Discover and run the project's static analysis and type verification script to ensure evaluation runners correctly conform to the evaluation schema contracts.
- Discover and run the evaluation test suite to verify that evaluation client calls execute without throwing unhandled exceptions when telemetry endpoints are unreachable.

Accept when:
- The evaluation library and its schema modules resolve successfully according to the project's lock artifact.
- Static type verification confirms that all evaluation outputs and datasets adhere to the standardized evaluation schemas.
- Evaluation runners execute successfully with safe fallback handling when remote evaluation credentials or network endpoints are unavailable.

## Enforcement

- Verified by: Continuous integration checks enforcing static typing and schema compliance across evaluation modules.
- Verified by: Peer code reviews validating error-boundary wrappers and credential handling in evaluation scripts.
- Violation handling: Pull requests introducing unwrapped evaluation client invocations or incompatible schema shapes are blocked during continuous integration.
- Exception process: Exceptions for offline-only evaluation harnesses must be submitted to the evaluation architecture owner with documented fallback logging specifications.