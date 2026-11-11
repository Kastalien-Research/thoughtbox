---
version: 2
name: 3ae80d29-36d6-4e1f-addf-0fa9f02fafe3-zod-runtime-schema-validation-for-boundary-inputs-schema-definitions-boundary-contracts-define-pagination
description: "Zod Runtime Schema Validation for Boundary Inputs: Schema Definitions Boundary Contracts Define Pagination"
metadata:
  actual:
    adr_id: 3ae80d29-36d6-4e1f-addf-0fa9f02fafe3
    status: accepted
    candidate_group_id: 3e51a323-08e1-4a0e-90d8-0f0a7e8c37f1
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Zod Runtime Schema Validation for Boundary Inputs: Schema Definitions Boundary Contracts Define Pagination

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `supabase`

Applies to:
- `functions/tb-branch/**`

## Context

- Boundary endpoints and serverless functions receive untrusted structured payloads, query parameters, and encoded tokens that require structural and semantic validation before execution.
- Static type definitions alone do not enforce data validity at runtime, leaving internal logic vulnerable to malformed inputs, type confusion, and unexpected null states.
- The codebase introduces runtime schema validation using Zod to parse and validate input data structures against declared schemas prior to domain processing.

## Problem Statement

HTTP entry points and background function handlers accept payloads from external callers without inherent runtime integrity guarantees. Lacking runtime input validation, invalid data structures, malformed tokens, or out-of-range parameters can cause unhandled exceptions or propagate invalid state into downstream storage and integration layers.

## Decision

1. SHOULD: Schema definitions for boundary contracts SHOULD define pagination parameters and numeric bounds to constrain resource utilization.

## Policy Block

- SHOULD Schema definitions for boundary contracts SHOULD define pagination parameters and numeric bounds to constrain resource utilization.

In scope:
- Serverless edge functions and HTTP boundary endpoints accepting external request bodies, parameters, or token payloads.
- Token payload parsing routines decoding claims before authorization or context propagation.

Out of scope:
- Internal function calls within trusted execution boundaries where types are established and validated at entry.
- Static internal configuration objects that are not constructed from external inputs.

Exceptions:
- EXC-42-001: A high-throughput binary streaming endpoint processes raw byte streams where schema parsing introduces prohibitive latency.

## Rationale

- Using Zod ensures that input validation happens at the boundary, converting untrusted input into verified typed data structures at runtime.
- Explicit schema definitions with parse enforcement eliminate invalid property assumptions and protect downstream services from malformed payloads.
- Centralizing validation logic into schema objects provides reusable, declarative constraints for complex data models like token claims and structured payload objects.

## Consequences

Positive:
- Guarantees runtime data validation at service boundaries, reducing unexpected failures caused by malformed input structures.
- Aligns compile-time and runtime types by deriving static types directly from validated runtime schemas.
- Defends downstream data stores and client integrations against unexpected field types or missing required attributes.

Negative:
- Adds runtime processing overhead for complex schema parsing on high-frequency invocations.
- Requires maintaining synchronized schema definitions alongside evolving request and response contract requirements.

## Alternatives

- Manual imperative validation using bespoke conditional logic and type guards (rejected)
  Rejected because: Imperative checks are error-prone, inconsistent across endpoints, and difficult to maintain as schema complexity grows.
  When valid: Trivial endpoints validating only a single primitive value without nested structures.
- Static interface assertions without runtime validation (rejected)
  Rejected because: Static type declarations are erased at compilation and provide zero runtime protection against malformed external payloads.
  When valid: Internal code paths operating entirely within statically verified type boundaries.

## Risks

- Uncaught schema parse exceptions in boundary handlers resulting in unhandled internal server errors instead of clean client error responses.
  Mitigation: Catch Zod validation errors at the HTTP boundary middleware and transform them into standardized 400 bad request responses.
  Owner: Security and Backend Engineering
- Performance degradation from deeply nested recursive schema validations on high-throughput endpoints.
  Mitigation: Profile schema parsing overhead and avoid over-specifying unbounded record schemas on critical paths.
  Owner: Performance Engineering

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Define Zod schemas adjacent to boundary route handlers and export inferred types for downstream internal usage.
- Use safeParse when graceful degradation or custom error response formatting is required over throwing exceptions.

## Continuation Context


Verify commands:
- Discover the project verification script from the root configuration and execute static analysis and type checking across all boundary handlers.
- Discover and run the project test suite to verify that boundary schemas reject invalid payloads and accept compliant data structures.

Accept when:
- All boundary endpoints validate incoming payloads and token claims against declared Zod schemas with zero unhandled validation errors.
- Automated test suites confirm that malformed payloads return client error responses while valid structures pass through to domain logic.

## Enforcement

- Verified by: Automated continuous integration test suites executing schema validation test fixtures.
- Verified by: Peer code review verifying that all newly introduced boundary endpoints declare and execute Zod schemas.
- Violation handling: Pull requests lacking runtime schema validation for external boundary endpoints are blocked from merge.
- Violation handling: Endpoints discovered processing unvalidated external input must be patched with corresponding Zod schemas before production deployment.
- Exception process: Submit an architectural review request detailing the latency constraints and alternative boundary verification mechanisms for approval by the security team.