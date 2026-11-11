---
version: 2
name: 207095dc-d2a4-4201-8e70-bc4f99adba31-hono-framework-adoption-for-service-api-boundaries-before-writing-code-that-imports-updates
description: "Hono Framework Adoption for Service API Boundaries: Before Writing Code That Imports Updates"
metadata:
  actual:
    adr_id: 207095dc-d2a4-4201-8e70-bc4f99adba31
    status: accepted
    candidate_group_id: 77d2e008-c5df-4798-839d-67bc2661b838
    evidence:
      source: deep
  scope:
    root: supabase
    paths:
      - functions/tb-branch/**
---

# Hono Framework Adoption for Service API Boundaries: Before Writing Code That Imports Updates

Status: proposed
Date: 2025-02-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `supabase`

Applies to:
- `functions/tb-branch/**`

## Context

- Edge-deployed functions require modular and structured routing mechanisms to dispatch incoming HTTP requests across distinct endpoints.
- Raw runtime request listener functions introduce boilerplate, manual path parsing, and fragile HTTP method switching logic when handling multiple verbs.
- Standardizing on a lightweight web application framework establishes consistent request lifecycle boundaries, uniform parameter handling, and maintainable endpoint definitions.

## Problem Statement

Serverless edge functions that handle multiple HTTP methods and paths require a standardized routing abstraction to avoid disparate, ad-hoc request parsing logic. Without a formalized routing framework, service boundary implementations risk fragmentation, inconsistent query and payload parameter extraction, and poor maintainability across independent edge functions.

## Decision

1. MUST: Before writing code that imports or updates the routing framework, the consumer MUST inspect the repository lock artifact to determine and adhere to the exact resolved framework dependency version.

## Policy Block

- MUST Before writing code that imports or updates the routing framework, the consumer MUST inspect the repository lock artifact to determine and adhere to the exact resolved framework dependency version.

In scope:
- Serverless edge functions defining public or internal HTTP service endpoints
- Edge request handlers dispatching multiple HTTP methods or structured URL paths

Out of scope:
- Non-HTTP event-driven background tasks and database trigger functions
- Static asset distribution and direct storage proxy endpoints

Exceptions:
- EXC-23-001: Single-purpose webhook listeners that process exactly one HTTP verb on a fixed root path with strict execution budget constraints

## Rationale

- The Hono framework provides a web-standards-aligned, minimal-footprint abstraction for defining declarative HTTP routing boundaries in edge execution environments.
- Binding route definitions directly to HTTP verbs on an application instance ensures separation of concerns and uniform request context passing across service operations.
- Adopting a standardized routing framework avoids duplicated parameter extraction and error handling logic across independently maintained edge functions.

## Consequences

Positive:
- Clear and declarative separation of HTTP endpoint routes and supported verb handlers.
- Consistent request and response lifecycle abstractions aligned with standard web platform interfaces.
- Reduced boilerplate and eliminated custom URL parsing bugs across edge service boundaries.

Negative:
- Introduces an external framework dependency into the edge function dependency footprint.
- Requires developers to adhere to framework routing conventions rather than writing raw runtime listener callbacks.

## Alternatives

- Custom URL parsing and manual switch statements on raw runtime request events (rejected)
  Rejected because: Manual request routing introduces repetitive boilerplate, error-prone path matching, and inconsistent parameter handling across endpoints.
  When valid: Trivial single-endpoint functions with zero path variability and strictly constrained dependency allowances.
- Heavyweight server frameworks adapted for containerized environments (rejected)
  Rejected because: Traditional server frameworks exceed edge function latency and cold-start execution constraints.
  When valid: Long-running monolithic backend services deployed in dedicated persistent container runtimes.

## Risks

- Framework API breaking changes between major releases impacting edge handler signatures.
  Mitigation: Lock exact dependency versions in repository lock artifacts and validate route behaviors via automated integration tests prior to deployment.
  Owner: Engineering Team
- Inconsistent middleware or error-handling conventions across different edge function instances.
  Mitigation: Establish shared application configuration factories and standardized error handler bindings across all edge routing definitions.
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
- Instantiate Hono application instances at the module level within edge functions and register route paths explicitly for incoming request dispatch.
- Extract route parameters and query tokens through framework request context methods to ensure uniform access and validation across endpoint handlers.

## Continuation Context


Verify commands:
- Discover and execute the project test runner script defined in the repository manifest to verify route dispatch and HTTP response status codes.
- Discover and run the project static analysis and linting script to ensure all edge functions declare routes via the designated framework.

Accept when:
- All edge HTTP service endpoints are registered through Hono application instances with explicit HTTP verb bindings.
- All automated endpoint route integration and unit test suites execute and pass without errors.
- Static analysis confirms no raw manual URL path parsing logic exists in edge function request handlers.

## Enforcement

- Verified by: Automated continuous integration pipelines executing endpoint test suites
- Verified by: Static code analysis checks verifying framework routing imports in edge functions
- Verified by: Peer code reviews for all pull requests modifying service boundaries
- Violation handling: Pull requests containing raw request dispatcher logic or unapproved routing libraries are blocked until refactored to use the framework.
- Violation handling: Continuous integration pipeline failures for unrouted or improperly structured edge handlers must be resolved prior to merge.
- Exception process: Submit an architectural review request documenting technical constraints that prevent framework usage.
- Exception process: Obtain explicit sign-off from the technical lead and record the exception in the service repository documentation.