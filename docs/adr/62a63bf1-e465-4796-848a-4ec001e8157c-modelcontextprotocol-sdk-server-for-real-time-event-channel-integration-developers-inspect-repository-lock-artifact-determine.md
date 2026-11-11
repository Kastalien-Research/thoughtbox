---
version: 2
name: 62a63bf1-e465-4796-848a-4ec001e8157c-modelcontextprotocol-sdk-server-for-real-time-event-channel-integration-developers-inspect-repository-lock-artifact-determine
description: "@modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Developers Inspect Repository Lock Artifact Determine"
metadata:
  actual:
    adr_id: 62a63bf1-e465-4796-848a-4ec001e8157c
    status: accepted
    candidate_group_id: 09b5534b-924c-4513-ba14-ce50de217165
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# @modelcontextprotocol/sdk Server for Real-Time Event Channel Integration: Developers Inspect Repository Lock Artifact Determine

Status: proposed
Date: 2025-02-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `plugins/thoughtbox-claude-code`

Applies to:
- `src/**`

## Context

- External integration endpoints require periodic cursor-based query parameters and session tokens to retrieve incremental event updates.
- Host client applications require real-time push event notification capabilities rather than managing individual external polling intervals.
- The Model Context Protocol SDK provides server and standard input/output transport modules with experimental channel capabilities for structured client-server communication.
- Runtime environment variables provide configuration keys and session identifiers that must be ingested without exposing secrets in channel payloads.

## Problem Statement

Integrating external event streams into local client environments requires a standardized, bidirectional real-time communication boundary that operates over process input/output without exposing network ports, while reliably transforming cursor-polled remote updates into decoupled push events.

## Decision

1. MUST: Developers MUST inspect the repository lock artifact to determine the exact resolved version of @modelcontextprotocol/sdk and verify that all invoked server capabilities exist in that resolved version prior to implementation.

## Policy Block

- MUST Developers MUST inspect the repository lock artifact to determine the exact resolved version of @modelcontextprotocol/sdk and verify that all invoked server capabilities exist in that resolved version prior to implementation.

In scope:
- Integration modules establishing real-time communication channels between host processes and external services.
- Background event clients responsible for polling remote endpoints and dispatching updates across process boundaries.

Out of scope:
- Synchronous request-response endpoints that do not participate in real-time event streaming.
- Stateless utility modules that execute without long-lived transport connections or background event loops.

## Rationale

- Adopting @modelcontextprotocol/sdk Server with standard input/output transport establishes a structured communication channel that integrates with host processes without network port allocation or socket management overhead.
- Declaring experimental channel capabilities enables bidirectional real-time event streaming while isolating protocol-specific channel structures from core domain logic.
- Bridging remote HTTP cursor polling to local event emitters provides fault isolation, preventing external rate limits or transport disconnects from destabilizing the real-time server process.

## Consequences

Positive:
- Standardizes process-level real-time communication using structured protocol channels without requiring network port allocation.
- Decouples upstream HTTP cursor-based polling from downstream event distribution through clean event emission boundaries.
- Enables structured capability negotiation and instruction sharing across process boundaries via standardized server interfaces.

Negative:
- Couples the integration architecture to experimental protocol capabilities that may evolve or require migration across protocol revisions.
- Requires dedicated error isolation and fallback handling to maintain background event loops when external endpoints experience transport failures.

## Alternatives

- Direct network socket or HTTP Server-Sent Events architecture (rejected)
  Rejected because: Opening network ports and managing HTTP streaming introduces socket lifecycle overhead, port collision risks, and firewall traversal requirements compared to local standard input/output streams.
  When valid: When real-time event distribution must bridge remote distributed systems across network boundaries rather than locally orchestrated processes.
- Synchronous request-driven polling without push channel notifications (rejected)
  Rejected because: Requiring clients to repeatedly poll external endpoints increases network overhead, introduces message latency, and couples client business logic directly to external endpoint schemas.
  When valid: When client workflows are strictly batch-driven and real-time responsiveness is not required.

## Risks

- Changes to experimental protocol channel capability specifications may introduce breaking contract alterations upon SDK updates.
  Mitigation: Pin the exact resolved protocol SDK version in the lock artifact and encapsulate capability declarations within isolated integration modules.
  Owner: engineering team
- External endpoint rate limits or network latency may cause polling pauses and delay event dissemination across the channel.
  Mitigation: Maintain cursor state across poll attempts, apply exponential backoff, and log non-fatal warnings without terminating the channel server.
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
- Initialize the Server instance with distinct server identification, instructions, and experimental capability declarations before binding to the standard input/output transport.
- Decouple external polling clients from channel transport handlers by emitting intermediate events, ensuring cursor advancement persists across transient channel disruptions.

## Continuation Context


Verify commands:
- Discover the repository build script from the dependency manifest and execute it to verify that real-time integration modules compile without errors.
- Discover the test execution script and run the automated test suite covering event client polling and server channel dispatching.
- Inspect the static analysis configuration and execute the repository linting script to validate compliance with event boundary typing and error handling.

Accept when:
- All integration tests exercising Model Context Protocol server initialization, stdio transport connection, and event dispatching execute cleanly without errors.
- The repository static type checking and linting processes complete with zero diagnostics across all integration modules.
- Event polling routines correctly advance cursor parameters and emit structured events without dropped payloads or unhandled rejections during simulated transport latency.

## Enforcement

- Verified by: Automated integration test suites verifying server lifecycle management, stdio transport binding, and event emission.
- Verified by: Peer code reviews confirming adherence to protocol server capability configuration and credential handling standards.
- Violation handling: Code changes that instantiate custom real-time socket listeners or bypass the protocol server abstraction for process communication must be rejected during review.
- Violation handling: Exposures of secret tokens or unhandled server process crashes must be treated as critical defects requiring remediation before deployment.
- Exception process: Teams requiring alternative transport bindings or bypassing protocol channel capabilities must submit an architecture exception request detailing operational constraints and boundary isolation measures for technical review.