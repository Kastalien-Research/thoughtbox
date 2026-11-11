---
version: 2
name: 3ac59bb7-cd5f-4ca5-aeaa-7023b21ac17b-adoption-of-fs-promises-for-asynchronous-file-system-operations-file-system-operations-coordinate-normalized-path
description: "Adoption of fs/promises for Asynchronous File System Operations: File System Operations Coordinate Normalized Path"
metadata:
  actual:
    adr_id: 3ac59bb7-cd5f-4ca5-aeaa-7023b21ac17b
    status: accepted
    candidate_group_id: 90329620-fa5b-4de5-9505-1d91bfe99efa
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/notebook/**
      - src/persistence/**
---

# Adoption of fs/promises for Asynchronous File System Operations: File System Operations Coordinate Normalized Path

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `scripts/**`
- `src/notebook/**`
- `src/persistence/**`

## Context

- File system interactions across the codebase occur within persistence storage services, execution state managers, and operational automation routines.
- Disparate file system access patterns risk introducing blocking synchronous I/O or callback-based control flow that impedes asynchronous runtime concurrency.
- Standardizing on the promise-based core file system interface establishes predictable asynchronous error propagation and non-blocking I/O across all storage operations.

## Problem Statement

Inconsistent file system access strategies across persistence mechanisms and automation scripts introduce risks of thread blocking, inconsistent error handling, and fragmented asynchronous control flow. Without a unified interface mandate, components may inadvertently adopt synchronous or callback-based patterns that degrade runtime responsiveness.

## Decision

1. SHOULD: File system operations SHOULD coordinate with normalized path resolution utilities to maintain cross-platform path handling consistency.

## Policy Block

- SHOULD File system operations SHOULD coordinate with normalized path resolution utilities to maintain cross-platform path handling consistency.

In scope:
- All application persistence layers, state management services, execution harnesses, and operational scripts performing file system I/O.

Out of scope:
- In-memory caching and transient state stores that do not interact with persistent disk storage.

Exceptions:
- EXC-20-001: A script or initialization routine executes synchronously prior to runtime event loop startup where asynchronous promise resolution is unsupported.

## Rationale

- Static analysis identifies consistent adoption of fs/promises across fourteen modules in both persistence subsystems and administrative scripting utilities.
- Adopting promise-based I/O ensures non-blocking execution across runtime services, preventing event loop starvation during concurrent state persistence operations.
- A unified asynchronous interface simplifies error propagation through standard promise rejections and asynchronous exception handling.

## Consequences

Positive:
- Consistent asynchronous programming model across application persistence and automation layers.
- Elimination of event loop blocking caused by synchronous disk I/O operations.
- Improved composability with asynchronous execution workflows and structured concurrency primitives.

Negative:
- Asynchronous interfaces require explicit error boundaries and await handling across call chains.
- Potential for unhandled promise rejections if consumers fail to catch underlying I/O errors.

## Alternatives

- Synchronous file system APIs (rejected)
  Rejected because: Synchronous operations block the event loop, degrading concurrency and responsiveness during disk read and write workloads.
  When valid: Only during early single-threaded process bootstrapping where an asynchronous runtime is unavailable.
- Callback-based file system APIs (rejected)
  Rejected because: Callback signatures lead to nested control flows and complicate error aggregation compared to promise-based interfaces.
  When valid: Legacy systems lacking promise runtime support.

## Risks

- Unhandled rejection of asynchronous disk I/O operations causing unhandled process exceptions.
  Mitigation: Enforce structured error handling and verification around all promise-returning file system calls.
  Owner: engineering team
- Concurrent file mutations leading to race conditions or partial file writes.
  Mitigation: Implement atomic file replacement patterns and serialization mechanisms for shared storage locations.
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
- Construct file paths using standard path normalization utilities prior to passing them into asynchronous file system operations.
- Ensure all asynchronous operations are awaited or chained with catch handlers to prevent unhandled rejection events.

## Continuation Context


Verify commands:
- Discover and execute the repository static analysis and linting scripts to verify that forbidden synchronous file system invocations are absent.
- Discover and execute the repository automated test suite to ensure that asynchronous persistence and file operations resolve cleanly.

Accept when:
- Static analysis checks pass with zero occurrences of prohibited synchronous file system calls in application and scripting code.
- All automated test suites exercising persistence and file storage components complete successfully.

## Enforcement

- Verified by: Automated static analysis checks in the continuous integration pipeline.
- Verified by: Peer code reviews of persistence and tooling pull requests.
- Violation handling: Continuous integration builds fail upon detection of prohibited synchronous file system calls.
- Violation handling: Pull requests containing disallowed file system access methods must be revised prior to merge approval.
- Exception process: Submit an architectural exception request detailing the necessity of synchronous execution during early process initialization.