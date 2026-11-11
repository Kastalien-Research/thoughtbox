---
version: 2
name: 11e3ad23-186c-482d-8a18-3e51687d3ad9-adoption-of-node-child-process-for-subprocess-lifecycle-management-long-running-subprocess-invocations-enforce-execution
description: "Adoption of node:child_process for Subprocess Lifecycle Management: Long Running Subprocess Invocations Enforce Execution"
metadata:
  actual:
    adr_id: 11e3ad23-186c-482d-8a18-3e51687d3ad9
    status: accepted
    candidate_group_id: ad78a3d2-11f1-4e04-b444-c836788d2afd
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/utils/**
      - src/peer-notebook/**
---

# Adoption of node:child_process for Subprocess Lifecycle Management: Long Running Subprocess Invocations Enforce Execution

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `scripts/utils/**`
- `src/peer-notebook/**`

## Context

- Subprocess execution requires strict process-level boundaries to prevent crashes or memory exhaustion from destabilizing the host application.
- Long-running peer execution invocations necessitate asynchronous lifecycle hooks, execution duration budgets, cancellation support, and stream aggregation.
- Operational scripts and runtime orchestration modules across the repository require operating system execution capabilities with structured stream handling and exit code propagation.

## Problem Statement

Managing external process invocations without structured lifecycle supervision risks orphaned subprocesses, unhandled stream backpressure, untracked process failures, and resource exhaustion within the host environment. The system requires a standardized pattern for spawning, monitoring, timing out, cancelling, and collecting output from child processes across runtime providers and operational scripts.

## Decision

1. MUST: Long-running subprocess invocations MUST enforce an execution timeout budget that terminates the child process and rejects with a timeout error upon expiration.

## Policy Block

- MUST Long-running subprocess invocations MUST enforce an execution timeout budget that terminates the child process and rejects with a timeout error upon expiration.

In scope:
- Execution of out-of-process peer runtime tasks and notebook evaluations
- Operational utility scripts executing external system commands and task handoffs

Out of scope:
- In-memory synchronous computational operations within the main event loop
- Standard file system read and write operations without external executable binary invocation

## Rationale

- Adopting the node:child_process core module provides native operating system process isolation without external third-party dependencies.
- Structured event handling across process streams guarantees deterministic resource cleanup and error propagation upon task completion or cancellation.
- Invocation registries and explicit timeout timers prevent runaway orphan processes from consuming host resources.

## Consequences

Positive:
- Host application processes remain isolated from failures, crashes, and memory leaks originating in child processes.
- Centralized lifecycle registries provide deterministic process cancellation and resource cleanup upon task termination.
- Standardizing on the core module eliminates third-party package dependencies for process execution.

Negative:
- Subprocess creation incurs operating system process management and context-switching overhead compared to in-thread operations.
- Inter-process communication requires string or buffer serialization and defensive output parsing safeguards.
- Coordinating stream lifecycle listeners, process maps, and timeout timers introduces state tracking complexity.

## Alternatives

- In-process evaluation or shared-memory worker threads (rejected)
  Rejected because: Fails to provide process-level isolation against unhandled exceptions, memory exhaustion, and native runtime termination during dynamic execution.
  When valid: High-throughput computational workloads that operate on shared memory without requiring crash isolation.
- Containerized execution environments via container runtime interfaces (deferred)
  Rejected because: Introduces substantial infrastructure overhead and deployment complexity disproportionate to local process supervision requirements.
  When valid: Multi-tenant environments requiring hardware-enforced sandboxing and kernel-level resource quotas.

## Risks

- Orphaned subprocesses consuming system resources if termination signals fail to propagate cleanly.
  Mitigation: Maintain an active process registry mapping invocation IDs to child instances and execute explicit kill routines upon cancellation or timeout expiration.
  Owner: Runtime Systems Team
- Excessive memory consumption caused by unbounded standard error or standard output stream buffering.
  Mitigation: Enforce stream buffer capture limits and truncate collected output before constructing diagnostic failure messages.
  Owner: Runtime Systems Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Attach error handlers to child process standard input streams to gracefully handle unexpected pipe termination.
- Clear active timeout timers within both error and close event listeners to prevent dangling timer handles in the event loop.

## Continuation Context


Verify commands:
- Discover and run static type checking across runtime provider and utility modules from the repository configuration.
- Discover and execute test suites covering process runtime providers, timeout enforcement, and cancellation handling.
- Execute repository linting tools to verify module import conventions.

Accept when:
- All subprocess invocations register lifecycle event handlers for standard output, standard error, error, and close events.
- Process timeout and cancellation test suites pass without hanging processes or orphaned background executions.
- Stream capture limits and diagnostic error propagation conform to repository safety boundaries.

## Enforcement

- Verified by: Automated test suites executing process spawning, cancellation, and timeout verification in continuous integration pipelines
- Verified by: Static analysis rules verifying event registration on child process streams and error handling compliance
- Verified by: Peer code reviews validating subprocess table tracking and resource cleanup mechanisms
- Violation handling: Code changes introducing unsupervised child process spawning or missing error handlers are blocked during review.
- Violation handling: Runtime failures caused by unhandled child process streams or orphaned processes are classified as high-priority defects.
- Exception process: Exceptions require review and approval from the runtime systems architecture team with documented justification and alternative isolation mitigations.