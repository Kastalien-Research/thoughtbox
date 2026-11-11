---
version: 2
name: 64bdde2b-5707-4dd2-b6cc-c7348943da42-console-api-error-logging-via-console-error-error-log-statements-pass-underlying-object
description: "Console API Error Logging via console.error: Error Log Statements Pass Underlying Object"
metadata:
  actual:
    adr_id: 64bdde2b-5707-4dd2-b6cc-c7348943da42
    status: accepted
    candidate_group_id: 84762ff2-9bcf-4366-b135-821dbdf9bea6
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - scripts/qa/**
      - src/app/**
---

# Console API Error Logging via console.error: Error Log Statements Pass Underlying Object

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `scripts/qa/**`
- `src/app/**`

## Context

- Application route handlers, server actions, error boundary components, and automation scripts require a mechanism to report operational failures and diagnostic exceptions to standard runtime diagnostic streams.
- The codebase directly invokes the runtime built-in console.error API at failure points without introducing or configuring an external logging library or centralized abstraction.
- Diagnostic output currently consists of unstructured or semi-structured messages and error objects passed directly to standard error output streams.

## Problem Statement

Operational error reporting across application boundaries and automation scripts relies on direct invocation of runtime standard error logging rather than a dedicated, structured logging framework, resulting in unstandardized diagnostic output without log levels, correlation identifiers, or centralized log shipping.

## Decision

1. MUST: Error log statements MUST pass the underlying error object or contextual descriptor alongside diagnostic messages to preserve error stack traces in standard error streams.

## Policy Block

- MUST Error log statements MUST pass the underlying error object or contextual descriptor alongside diagnostic messages to preserve error stack traces in standard error streams.

In scope:
- Application route handlers, server actions, error boundaries, and automation scripts emitting diagnostic failure records.

Out of scope:
- Standard informational tracing, performance metric aggregation, and components integrating dedicated telemetry clients.

## Rationale

- Direct invocation of console.error requires zero external dependencies and functions universally across server runtimes, client environments, and local execution scripts.
- Static analysis confirms console.error is used across multiple functional areas as the default diagnostic output channel for operational failures.
- While suitable for local diagnostics, reliance on runtime console logging lacks centralized log level filtering, correlation contexts, and structured transport schemas.

## Consequences

Positive:
- Zero dependency footprint and immediate availability across all execution environments without configuration overhead.
- Direct output to standard error streams integrates seamlessly with default container and runtime log aggregation mechanisms.
- Low cognitive overhead for developers outputting diagnostic messages during exception handling.

Negative:
- Absence of structured log schemas impedes automated parsing, indexing, and querying in downstream observability platforms.
- No configurable log levels or dynamic filtering, leading to potential noise or uncoordinated log volume.
- Lack of correlation identifiers complicates tracing transactions across disparate asynchronous operations and service boundaries.

## Alternatives

- Structured logging library adoption (deferred)
  Rejected because: No external or internal logging module has been introduced into the repository dependencies, and direct console output currently fulfills immediate error output requirements.
  When valid: Valid when distributed tracing, structured JSON payload aggregation, or severity level filtering becomes an operational requirement.
- Silent failure handling without diagnostic emission (rejected)
  Rejected because: Suppressing exceptions without recording diagnostic output prevents troubleshooting of runtime errors and operational regressions.
  When valid: Valid only for non-critical, expected fallback scenarios where the failure state is fully recovered without diagnostic utility.

## Risks

- Sensitive data or credentials may be inadvertently logged to standard error output streams through unredacted error payloads.
  Mitigation: Ensure error logging statements omit secrets and sanitize contextual metadata prior to invocation.
  Owner: Engineering team
- Unstructured console error output creates maintenance debt when migrating to an enterprise observability pipeline.
  Mitigation: Encapsulate logging call sites within consistent error boundary and action wrappers to ease future migration to a structured logger.
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
- Provide descriptive contextual strings as the leading argument to console.error to ensure clear identification of the failing operation.
- Pass error instances as distinct parameters rather than string-concatenating them to preserve stack trace formatting across runtime environments.

## Continuation Context


Verify commands:
- # Discover the repository static analysis and verification commands from the project configuration manifest and execute them across the codebase
- # Discover and run the project test suites from the root configuration to verify that error handling pathways execute as expected

Accept when:
- All error handling pathways execute without unhandled rejections and emit diagnostic failure records to standard error streams.
- Static analysis and repository verification suites pass with zero unhandled diagnostics or syntax violations.

## Enforcement

- Verified by: Automated continuous integration checks executing repository lint and verification directives.
- Verified by: Peer code review verifying appropriate error capture and diagnostic message clarity.
- Violation handling: Pull requests omitting error logging in critical failure handlers or logging sensitive information will be blocked during code review.
- Violation handling: Failures in automated repository verification will prevent branch merging.
- Exception process: Submit an architectural review request documenting the rationale for suppressing diagnostic output or using specialized telemetry sinks.