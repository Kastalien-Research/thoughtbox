---
version: 2
name: f537a0ff-32d9-44a8-b0ea-95ad79370ec3-modelcontextprotocol-sdk-stdio-transport-diagnostic-logging-prior-implementing-updating-modules-depending-modelcontextprotocol
description: "@modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Prior Implementing Updating Modules Depending Modelcontextprotocol"
metadata:
  actual:
    adr_id: f537a0ff-32d9-44a8-b0ea-95ad79370ec3
    status: accepted
    candidate_group_id: 13e3836e-c533-4bcb-ad41-d53b76e25871
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Stdio Transport Diagnostic Logging: Prior Implementing Updating Modules Depending Modelcontextprotocol

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `plugins/thoughtbox-claude-code`

Applies to:
- `src/**`

## Context

- Inter-process communication utilizing @modelcontextprotocol/sdk over standard input and output requires strict protocol framing integrity across the communication pipe.
- Uncontrolled diagnostic writes to standard output corrupt JSON-RPC transport frames and lead to immediate client disconnection.
- Operational diagnostics, configuration validation alerts, and event filtering drops require visibility without interfering with the active transport session.
- Runtime channel configuration sources and session filters must provide actionable feedback when configuration states prevent event delivery.

## Problem Statement

When deploying @modelcontextprotocol/sdk server implementations over stdio transports, diagnostic and operational log messages routed to standard output corrupt the JSON-RPC message framing required for client communication. The channel server and event handling infrastructure require a dependable logging mechanism to report configuration mismatches, dropped events, and initialization status without compromising the integrity of the protocol stream.

## Decision

1. MUST: Prior to implementing or updating modules depending on @modelcontextprotocol/sdk, the consumer MUST inspect the repository lock artifact to determine and verify the exact resolved dependency version.

## Policy Block

- MUST Prior to implementing or updating modules depending on @modelcontextprotocol/sdk, the consumer MUST inspect the repository lock artifact to determine and verify the exact resolved dependency version.

In scope:
- All server components, event filters, and transport adapters participating in @modelcontextprotocol/sdk stdio communication sessions.
- Operational, diagnostic, and error reporting originating from channel runtime modules.

Out of scope:
- Standalone background workers operating without standard input and output protocol bindings.
- Production logging pipelines decoupled from the immediate stdio process stream.

Exceptions:
- EXC-46-001: A transport mechanism other than stdio is explicitly configured and validated

## Rationale

- Separating diagnostic output to console.error preserves the purity of the standard output stream for @modelcontextprotocol/sdk transport frames.
- Prefixing diagnostic messages with a uniform channel identifier provides clear provenance during process debugging without external logging framework overhead.
- Silencing repetitive event drop messages prevents log flooding over standard error while maintaining initial diagnostic transparency.

## Consequences

Positive:
- Guarantees protocol framing reliability by completely eliminating log pollution from standard output.
- Provides immediate operational visibility into configuration errors and event drops through standard error streams.
- Introduces zero external logging dependencies into lightweight protocol adapter modules.

Negative:
- Unstructured text emitted to standard error lacks automated parsing and search capabilities of dedicated structured logging engines.
- Standard error streams may interleave across concurrent asynchronous operations without centralized log serialization.

## Alternatives

- Standard Output Logging with Interleaved Frames (rejected)
  Rejected because: Emitting arbitrary text to standard output breaks the framing protocol of @modelcontextprotocol/sdk stdio transport, resulting in deserialization failures.
  When valid: Only valid in interactive command-line utilities with no parent process protocol bindings.
- External Dedicated File-Based Structured Logger (rejected)
  Rejected because: Adds filesystem permission dependencies and configuration complexity to lightweight channel plugin modules.
  When valid: Valid when operating long-running enterprise services with centralized log aggregation requirements.

## Risks

- High-volume error logging to standard error could impact process execution speed or flood parent process logs.
  Mitigation: Enforce initial-warning drop policies and suppress recurring error messages after the first notification.
  Owner: Engineering Team
- Accidental use of standard output logging in newly authored channel modules could corrupt protocol transport.
  Mitigation: Implement static analysis checks and code review guidelines blocking standard output statements across stdio server source files.
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
- Channel logging messages emitted via console.error should follow a standardized message prefix format to ensure traceability across process supervisor logs.
- Event filters dropping messages due to session targeting must log an informative warning on the first drop and subsequently suppress identical warnings to prevent stream saturation.

## Continuation Context


Verify commands:
- Discover the static analysis validation script from the project manifest and execute it to verify that no standard output logging invocations exist within channel server modules.
- Discover the project test execution script from the repository configuration and run the test suite to confirm that stdio transport integrity remains uncorrupted by diagnostic logging.

Accept when:
- Static analysis validates zero standard output logging calls within modules communicating over @modelcontextprotocol/sdk stdio transport.
- Test execution passes with all diagnostic, warning, and error outputs successfully directed to standard error.

## Enforcement

- Verified by: Automated static analysis checks in the continuous integration pipeline.
- Verified by: Peer code review verification for all changes within stdio server and event filter modules.
- Violation handling: Pull requests containing unauthorized standard output statements in stdio modules are blocked until corrected.
- Exception process: Submit an architectural review request justifying why standard error logging cannot be utilized for the specified component.