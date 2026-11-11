---
version: 2
name: 8351c0f1-5d88-46a1-b126-f4d321e4820b-zod-schema-validation-for-protocol-tool-input-contracts-protocol-tool-entry-points-not-accept
description: "Zod Schema Validation for Protocol Tool Input Contracts: Protocol Tool Entry Points Not Accept"
metadata:
  actual:
    adr_id: 8351c0f1-5d88-46a1-b126-f4d321e4820b
    status: accepted
    candidate_group_id: f8c6cfb7-64f5-472b-bf29-b0e3753683a5
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
---

# Zod Schema Validation for Protocol Tool Input Contracts: Protocol Tool Entry Points Not Accept

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/protocol/**`

## Context

- Protocol tools execute multi-step operational lifecycles requiring structured inputs and deterministic state machine transitions
- Boundary input payloads must be validated at runtime to prevent malformed data from propagating into domain handlers
- Static type definitions alone do not survive runtime execution to protect system boundaries

## Problem Statement

Protocol tool definitions require rigorous runtime input validation and explicit operational schemas to prevent malformed payloads, ensure valid state machine transitions, and provide runtime self-describing field metadata across protocol boundaries.

## Decision

1. MUST_NOT: Protocol tool entry points MUST NOT accept raw unvalidated input payloads without passing them through schema validation.

## Policy Block

- MUST_NOT Protocol tool entry points MUST NOT accept raw unvalidated input payloads without passing them through schema validation.

In scope:
- Protocol tool definitions and operational input contracts
- Runtime input validation at protocol service boundaries

Out of scope:
- Internal utility modules operating strictly within trusted module boundaries
- Pure computational helpers with compile-time type guarantees

## Rationale

- Runtime validation ensures protocol handlers receive structurally sound payloads, eliminating defensive parameter checking within handler logic
- Zod schemas couple runtime parsing with static type inference, providing a single source of truth for contract definitions
- Declarative schema descriptors allow protocol operations and parameters to be self-documenting at runtime

## Consequences

Positive:
- Enforces deterministic runtime validation for protocol tool operations and payload inputs
- Eliminates defensive type assertion boilerplate by providing inferred static types from runtime schemas
- Establishes self-describing schema metadata that can be inspected dynamically by protocol consumers

Negative:
- Introduces runtime parsing and evaluation overhead on protocol execution paths
- Requires maintaining synchronization between runtime schema definitions and evolving protocol specifications

## Alternatives

- Manual procedural validation using conditional checks and custom type guards (rejected)
  Rejected because: Procedural validation logic is verbose, error-prone, difficult to keep synchronized with static types, and lacks declarative field metadata
  When valid: Simple internal functions with primitive parameters where external dependencies cannot be introduced
- Compile-time static type definitions without runtime schema validation (rejected)
  Rejected because: Static types are completely erased at runtime and cannot verify external or untrusted protocol payload inputs
  When valid: Internal module communications within a fully trusted runtime boundary

## Risks

- Repeated schema construction in high-throughput protocol execution paths may degrade performance
  Mitigation: Define schemas statically at module load time rather than instantiating schema objects inside invocation paths
  Owner: engineering team
- Upstream validation library updates could introduce subtle behavioral changes in schema parsing
  Mitigation: Verify resolved lock-file versions and execute boundary validation test suites prior to updating library versions
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
- Export shared sub-schemas for common protocol objects to ensure uniform validation across tool implementations
- Derive TypeScript handler parameter interfaces directly from Zod schemas using type inference to avoid duplicate type definitions

## Continuation Context


Verify commands:
- Discover and run the project test suite covering protocol validation contracts
- Discover and run the project static type checker and linter across protocol tool definitions

Accept when:
- All protocol tool operations validate inputs against defined schemas without unhandled runtime parsing errors
- Static type checks and automated test suites pass across all protocol tool definitions

## Enforcement

- Verified by: Automated continuous integration pipeline executing protocol contract test suites
- Verified by: Peer review of protocol tool boundary definitions prior to integration
- Violation handling: Pull requests introducing unvalidated protocol tool boundaries are blocked from merging
- Violation handling: Protocol handler invocations receiving invalid payloads fail fast with structured validation errors
- Exception process: Exceptions require formal review and approval from architectural deciders with documented justification for alternative boundary protections