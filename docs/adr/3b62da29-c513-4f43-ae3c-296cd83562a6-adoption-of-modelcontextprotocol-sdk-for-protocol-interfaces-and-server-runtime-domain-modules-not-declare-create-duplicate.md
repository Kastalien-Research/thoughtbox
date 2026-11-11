---
version: 2
name: 3b62da29-c513-4f43-ae3c-296cd83562a6-adoption-of-modelcontextprotocol-sdk-for-protocol-interfaces-and-server-runtime-domain-modules-not-declare-create-duplicate
description: "Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Domain Modules Not Declare Create Duplicate"
metadata:
  actual:
    adr_id: 3b62da29-c513-4f43-ae3c-296cd83562a6
    status: accepted
    candidate_group_id: 953639aa-abba-4411-9669-578c07237d35
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/**
---

# Adoption of @modelcontextprotocol/sdk for Protocol Interfaces and Server Runtime: Domain Modules Not Declare Create Duplicate

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/**`

## Context

- The application implements server capabilities, session management, branch operations, and task storage that interface with external clients via the Model Context Protocol.
- Defining disparate or custom protocol communication schemas across distinct domain modules introduces contract drift, integration failures, and serialization mismatches.
- The codebase requires a standardized dependency to provide canonical type definitions, server initialization primitives, and task contract interfaces across all protocol-facing components.

## Problem Statement

Decentralized or ad-hoc definitions of protocol types, message frames, and server handlers risk protocol non-compliance and interoperability breakage across client integrations. Without a unified protocol SDK adoption, domain operations across sessions, branches, notebooks, and background tasks diverge in their handling of protocol payloads, schema validation, and lifecycle events.

## Decision

1. MUST_NOT: Domain modules MUST NOT re-declare or create duplicate type definitions for protocol messages, tool specifications, or task contracts that are provided by @modelcontextprotocol/sdk.

## Policy Block

- MUST_NOT Domain modules MUST NOT re-declare or create duplicate type definitions for protocol messages, tool specifications, or task contracts that are provided by @modelcontextprotocol/sdk.

In scope:
- All components implementing protocol server endpoints, tool handlers, session operations, branch operations, and task storage.
- All domain modules serializing or deserializing protocol payloads and messages.

Out of scope:
- Internal domain utilities, purely local state storage, and validation schemas that do not interact with protocol framing or client transport boundaries.

## Rationale

- Adopting @modelcontextprotocol/sdk across server and domain operation modules guarantees protocol conformance and prevents schema divergence between server endpoints and client drivers.
- Centralizing protocol types on @modelcontextprotocol/sdk/types.js eliminates redundant interface declarations and ensures type consistency across operational modules.
- Utilizing official server abstractions from @modelcontextprotocol/sdk/server/mcp.js reduces transport boilerplate and centralizes connection lifecycle management.

## Consequences

Positive:
- Guarantees strict compliance with protocol standards across all server operations and tool endpoints.
- Eliminates duplicate type maintenance and contract drift between domain operations and protocol message handlers.
- Provides standardized access to official protocol server features and experimental task interfaces.

Negative:
- Introduces an architectural dependency on the external protocol SDK release cycle and subpath export stability.
- Requires disciplined dependency version management to prevent breaking changes in protocol types across experimental features.

## Alternatives

- Bespoke internal protocol type definitions and custom server transport implementation (rejected)
  Rejected because: Re-implementing protocol types and transport framing increases maintenance overhead and leads to protocol drift against evolving specification standards.
  When valid: Only when strict environmental limitations prevent external dependencies or when operating on an isolated, non-standard protocol variant.
- Generic RPC or REST transport contracts without protocol SDK integration (rejected)
  Rejected because: Fails to meet Model Context Protocol requirements for structured tool negotiation, session lifecycle, and client interoperability.
  When valid: When building non-protocol microservices intended solely for internal cluster communication without protocol client exposure.

## Risks

- Breaking changes in upstream SDK minor or experimental releases could invalidate subpath imports or type contracts.
  Mitigation: Lock dependencies explicitly via repository lock artifacts and verify public API availability against the locked version before upgrading.
  Owner: engineering team
- Reliance on experimental subpaths such as task interfaces may cause instability if upstream APIs undergo refactoring.
  Mitigation: Encapsulate experimental SDK interfaces behind internal adapter boundaries to insulate stable core server operations.
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
- Import all core protocol data types directly from the designated types subpath of @modelcontextprotocol/sdk rather than defining parallel interface definitions.
- Configure server runtime instances through the official server entry point of @modelcontextprotocol/sdk to maintain consistent lifecycle and error handling behaviors.

## Continuation Context


Verify commands:
- grep -rn "@modelcontextprotocol/sdk" .
- # Discover and execute the project typecheck command from the repository manifest to verify protocol type compliance
- # Discover and execute the project test suite from the repository manifest to verify protocol server handlers and operation endpoints

Accept when:
- All protocol server handlers, operations, and task stores import types and runtime interfaces directly from @modelcontextprotocol/sdk.
- The discovered repository typecheck and test verification suites execute without compilation or runtime errors.
- No duplicate or parallel protocol message interfaces exist outside the official SDK type definitions.

## Enforcement

- Verified by: Automated continuous integration type-checking and test suite execution on pull requests.
- Verified by: Peer code review verifying that new protocol operations import from @modelcontextprotocol/sdk.
- Violation handling: Pull requests introducing custom protocol types or bypassing official SDK server primitives are blocked until refactored.
- Exception process: Exceptions for non-standard protocol transports or isolation testing require approval from the principal architecture lead and documented justification.