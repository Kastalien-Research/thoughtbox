---
version: 2
name: 19da73b1-7a79-44b4-ac40-5df52dddea53-adoption-of-node-fs-promises-for-asynchronous-file-system-operations-core-module-import-declarations-include-protocol
description: "Adoption of node:fs/promises for Asynchronous File System Operations: Core Module Import Declarations Include Protocol"
metadata:
  actual:
    adr_id: 19da73b1-7a79-44b4-ac40-5df52dddea53
    status: accepted
    candidate_group_id: b056b885-477f-4802-8e96-21d428e838ec
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/cli/**
---

# Adoption of node:fs/promises for Asynchronous File System Operations: Core Module Import Declarations Include Protocol

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `plugins/thoughtbox-claude-code`

Applies to:
- `src/cli/**`

## Context

- Command-line lifecycle hooks and configuration utilities require persistent storage access to read configuration files and state records.
- Evidence across CLI utility and configuration modules demonstrates exclusive reliance on promise-based filesystem operations using protocol-prefixed imports.
- Synchronous file interactions block single-threaded event loops, introducing latency bottlenecks into CLI execution flows.

## Problem Statement

Command-line interface utilities and lifecycle hooks interact with local storage to parse configurations and persist execution state. Utilizing synchronous filesystem calls blocks the single-threaded runtime loop and degrades response latency, while legacy callback-driven interfaces complicate control flow and exception containment. A unified asynchronous filesystem convention is needed across CLI runtime modules.

## Decision

1. MUST: Core module import declarations MUST include the protocol scheme prefix for explicit runtime module resolution.

## Policy Block

- MUST Core module import declarations MUST include the protocol scheme prefix for explicit runtime module resolution.

In scope:
- Runtime configuration management and persistence layers
- Command-line interface hook dispatchers and execution utilities
- Shared file access helper modules within CLI boundaries

Out of scope:
- In-memory virtual file systems utilized exclusively within isolated test suites
- Build-time code generation scripts executing outside the CLI runtime boundary

Exceptions:
- EXC-20-001: A native plugin interface strictly requires synchronous file descriptors during early process bootstrap

## Rationale

- Static analysis evidence shows consistent imports of node:fs/promises across hook management, shared utilities, and configuration modules.
- Asynchronous promise-based filesystem operations prevent event loop starvation during CLI hook dispatches.
- Adopting node:fs/promises provides native async/await compatibility and simplifies structured error handling across execution boundaries.

## Consequences

Positive:
- Prevents runtime event loop thread starvation during command execution and hook lifecycle events.
- Standardizes filesystem access across the codebase using uniform async/await syntax and native promises.
- Eliminates boilerplate wrapper code previously needed for manual promise conversion.

Negative:
- Requires all upstream functions across call chains to adopt asynchronous return signatures.
- Unhandled promise rejections from disk access errors can cause runtime crashes if not trapped by structured exception boundaries.

## Alternatives

- Synchronous filesystem operations via core blocking methods (rejected)
  Rejected because: Blocks the runtime event loop during disk I/O, introducing latency degradation into command lifecycle and hook processing paths.
  When valid: Permissible only during one-time pre-initialization scripts where no event loop or concurrent task processing exists.
- Callback-based filesystem interfaces (rejected)
  Rejected because: Forces nested callback structures, degrades error tracking, and impairs integration with modern asynchronous control flows.
  When valid: Legacy runtimes lacking native promise support.

## Risks

- Uncaught asynchronous disk exceptions causing runtime process crashes
  Mitigation: Enforce structured exception handling blocks around all asynchronous filesystem interactions to trap disk failures
  Owner: CLI Engineering Team
- Concurrent asynchronous writes to identical file paths causing race conditions or file corruption
  Mitigation: Serialize concurrent file writes using atomic write patterns or designated lock sequences
  Owner: CLI Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Discover the project static analysis configuration and ensure rules enforce protocol scheme prefixes on runtime module imports.
- Encapsulate filesystem read operations that deserialize structured payloads within guarded blocks to catch data corruption errors.

## Continuation Context


Verify commands:
- Discover the repository static analysis script and execute it to verify compliance with core module import rules.
- Discover the repository test execution script and run the test suite to confirm asynchronous operations complete without unhandled rejections.

Accept when:
- Static analysis validates that all filesystem imports utilize node:fs/promises with explicit protocol scheme prefixes.
- Automated test execution confirms that all filesystem interactions complete without unhandled promise rejections.

## Enforcement

- Verified by: Continuous integration static analysis pipelines validating import declarations
- Verified by: Peer code reviews assessing asynchronous error handling patterns
- Violation handling: Pull requests introducing synchronous filesystem operations or legacy callback patterns are rejected at review stage.
- Exception process: Submit an architecture review request detailing why asynchronous operations cannot meet operational requirements, accompanied by performance profiles.