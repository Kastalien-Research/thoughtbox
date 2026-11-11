---
version: 2
name: 32832873-0393-405b-a7e1-12fa957fc3f7-adoption-of-event-types-internal-module-for-ingestion-and-client-event-contracts-event-transport-clients-decode-incoming-payloads
description: "Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Transport Clients Decode Incoming Payloads"
metadata:
  actual:
    adr_id: 32832873-0393-405b-a7e1-12fa957fc3f7
    status: accepted
    candidate_group_id: 93ae00ee-4c65-4887-906a-790458852c2d
    evidence:
      source: deep
  scope:
    root: plugins/thoughtbox-claude-code
    paths:
      - src/**
---

# Adoption of event-types Internal Module for Ingestion and Client Event Contracts: Event Transport Clients Decode Incoming Payloads

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `plugins/thoughtbox-claude-code`

Applies to:
- `src/**`

## Context

- Event ingestion is supported across multiple transport mechanisms including real-time server-sent events and periodic cursor-based polling clients
- Event filtering components require deterministic access to event metadata such as event type and session attribution to enforce routing policies
- Multiple independent modules previously risked defining divergent representations of incoming event data structures

## Problem Statement

Multiple event transport clients and event filtering pipelines require a single source of truth for domain event definitions to prevent schema divergence, runtime field mismatches, and uncoordinated event payload deserialization.

## Decision

1. MUST: Event transport clients MUST decode incoming payloads into typed event objects conforming to the event-types contract before passing them to internal emitters or filtering logic.

## Policy Block

- MUST Event transport clients MUST decode incoming payloads into typed event objects conforming to the event-types contract before passing them to internal emitters or filtering logic.

In scope:
- Event ingestion transport clients utilizing streaming or polling mechanisms
- Event filtering, routing, and dispatch components operating within the client plugin subsystem

Out of scope:
- Internal transport-agnostic utilities that do not handle or process domain event structures
- Configuration management components that only store connection settings without manipulating events

## Rationale

- Consolidating event contracts into a dedicated internal event-types module guarantees schema consistency across disparate transport channels
- Centralized event types enable filtering components to reliably verify session attribution and event categories prior to workspace-wide propagation
- Static analysis proves that streaming clients, polling clients, and event filters all depend upon the same canonical event-types contract

## Consequences

Positive:
- Guarantees structural and contractual parity between streaming and polling event ingestion implementations
- Enforces consistent access to event classification and session attribution properties across filtering layers
- Prevents silent contract drift and runtime deserialization defects across event processing components

Negative:
- Changes to the centralized event types module require coordinated updates across all dependent ingestion clients and filtering adapters
- Transport components become strictly coupled to the shared event type representation rather than operating purely on raw payloads

## Alternatives

- Ad-hoc local type declarations within each event client and filter module (rejected)
  Rejected because: Independent type definitions lead to schema drift between polling and streaming ingestion pathways and increase defect rates in event filtering logic
  When valid: Initial prototyping of an isolated standalone client prior to integration into the unified event subsystem
- Untyped event emission using generic key-value dictionary records (rejected)
  Rejected because: Eliminates compile-time type verification and risks runtime property access exceptions when inspecting event type and session attribution fields
  When valid: Transparent network forwarders or raw byte proxies that relay event streams without inspecting or filtering payload properties

## Risks

- Modifications to shared event types can introduce breaking changes across all dependent ingestion clients and filters simultaneously
  Mitigation: Maintain backward compatibility in event payload contracts and execute comprehensive contract tests prior to releasing updates
  Owner: engineering team
- Tight coupling between transport clients and the core event schema module may slow development if the schema evolves frequently
  Mitigation: Isolate transport-specific envelope metadata from the underlying domain event payload definitions within the shared module
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
- When introducing new event categories or modifying payload attributes, update the internal event-types module before consuming new structures in transport clients
- Ensure transport clients decode incoming serialized payloads into typed representations defined by the event-types module prior to event emission

## Continuation Context


Verify commands:
- echo "Discover and execute the project static type verification suite to validate event type compliance"
- echo "Discover and run the project test suite covering event ingestion clients and filtering adapters"

Accept when:
- All event transport clients and event filtering modules resolve event data structures from the internal event-types module without type errors
- Static type verification and contract testing suites pass without unvalidated event payload accesses across streaming and polling ingestion pathways

## Enforcement

- Verified by: Automated static analysis and type verification checks executed during continuous integration
- Verified by: Peer architectural review of pull requests touching event transport clients, filtering modules, or event schemas
- Violation handling: Builds that define local duplicate event types or consume untyped event payloads will fail verification
- Violation handling: Pull requests containing ungrounded event interfaces must be refactored to consume the internal event-types module
- Exception process: Submit an architecture review request detailing why an event transport client requires custom decoupled type definitions
- Exception process: Document the isolated boundary and obtain sign-off from the lead architect before introducing independent event schemas