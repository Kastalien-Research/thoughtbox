---
version: 2
name: 6f659fad-568e-4e49-9d7a-5f3cc22e9fcd-runtime-console-api-for-operational-logging-operational-handlers-not-suppress-caught-error
description: "Runtime Console API for Operational Logging: Operational Handlers Not Suppress Caught Error"
metadata:
  actual:
    adr_id: 6f659fad-568e-4e49-9d7a-5f3cc22e9fcd
    status: accepted
    candidate_group_id: 8545acc7-4328-426e-8a32-88b80982fc9e
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - .agents/skills/effect-ts/scripts/**
      - .claude/skills/effect-ts/scripts/**
      - scripts/**
      - src/**
---

# Runtime Console API for Operational Logging: Operational Handlers Not Suppress Caught Error

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `.agents/skills/effect-ts/scripts/**`
- `.claude/skills/effect-ts/scripts/**`
- `scripts/**`
- `src/**`

## Context

- Command-line scripts, evaluation harnesses, and background operational handlers require immediate diagnostic feedback for failure reporting and runtime warnings.
- Adopting heavyweight centralized logging frameworks for standalone scripts and automation utilities introduces excessive configuration overhead and dependency bloat.
- The codebase predominantly relies on native runtime error and warning streams with contextual string prefixes to report operational states.

## Problem Statement

Operational automation, CLI utilities, and runtime handlers require an accessible, zero-dependency mechanism to report warnings, configuration gaps, and fatal execution errors to standard streams without introducing architectural coupling to external logging services.

## Decision

1. MUST_NOT: Operational handlers MUST NOT suppress caught error messages when logging failure states to standard error.

## Policy Block

- MUST_NOT Operational handlers MUST NOT suppress caught error messages when logging failure states to standard error.

In scope:
- Standalone command-line scripts, evaluation harnesses, and background event handlers requiring lightweight diagnostic output
- Operational error reporting and warning notification where dedicated logging service infrastructure is absent

Out of scope:
- Production services requiring structured telemetry, distributed tracing ingestion, or centralized log shipping
- High-throughput data ingestion pipelines requiring asynchronous buffered logging

## Rationale

- Native runtime console error and warning functions provide immediate zero-dependency operational reporting across automation scripts and handlers.
- Prefixing log messages with subsystem identifiers provides sufficient operational context for manual triage without the complexity of structured telemetry infrastructure.
- Static analysis across fifty-one files indicates consistent adoption of direct console stream invocations for CLI usage errors, missing configuration alerts, and execution failures.

## Consequences

Positive:
- Zero external logging dependencies or configuration boilerplate required for scripts and utility handlers
- Immediate visibility of errors and warnings on standard error streams during interactive and automated execution
- Low cognitive overhead for developers authoring new scripts or background handlers

Negative:
- Absence of structured JSON formatting hinders automated log aggregation and centralized telemetry parsing
- Inability to dynamically configure log levels or filter output verbosity globally at runtime

## Alternatives

- Adopting a centralized structured logging framework (rejected)
  Rejected because: Introducing external structured logging dependencies across lightweight CLI tools and automation scripts adds unnecessary configuration overhead and bundle complexity when standard error streams suffice
  When valid: Valid when services require JSON-structured logging, log levels, and direct shipping to centralized observability platforms
- Silent failure handling without diagnostic stream emission (rejected)
  Rejected because: Suppressing diagnostic output prevents root-cause analysis during script failures and evaluation errors
  When valid: Valid only in performance-critical inner loops where error metrics are captured out-of-band

## Risks

- Unstructured console output complicates automated log parsing and centralized observability indexing
  Mitigation: Standardize on consistent message prefixes and limit unstructured emission to non-production CLI and evaluation flows
  Owner: Engineering Team
- Direct console invocations cannot be dynamically reconfigured or leveled at runtime
  Mitigation: Encapsulate high-volume operational logging behind subsystem boundaries if dynamic log level filtering becomes necessary
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
- Subsystems emitting diagnostic warnings should prefix their message strings with the subsystem identifier to provide context when reading aggregated logs.
- When capturing caught exceptions for output, pass the error instance or its message string explicitly to preserve diagnostic detail.

## Continuation Context


Verify commands:
- Discover the project verification scripts from the repository manifest and execute them to verify that console invocations adhere to static analysis and operational guidelines.
- Discover and run the static analysis script defined in the project configuration to ensure error and warning streams are handled consistently across modules.

Accept when:
- Static analysis checks pass with zero unhandled logging violations across all modules.
- All automated test suites and script validation targets execute and complete with expected diagnostic stream output.

## Enforcement

- Verified by: Automated code analysis and linting checks configured in the repository
- Verified by: Peer code review during pull request evaluation
- Violation handling: Pull request merge is blocked until non-compliant or silent error logging patterns are corrected
- Exception process: Exceptions require documented justification and approval from engineering leads in the code review discussion