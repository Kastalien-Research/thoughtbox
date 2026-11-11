---
version: 2
name: 3adfcef7-36d6-40a9-868f-21e4013528b1-adoption-of-next-js-navigation-module-for-application-route-handling-components-not-bypass-framework-navigation-abstractions
description: "Adoption of Next.js Navigation Module for Application Route Handling: Components Not Bypass Framework Navigation Abstractions"
metadata:
  actual:
    adr_id: 3adfcef7-36d6-40a9-868f-21e4013528b1
    status: accepted
    candidate_group_id: 773a65a9-728b-45f5-9e58-712632fa746d
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of Next.js Navigation Module for Application Route Handling: Components Not Bypass Framework Navigation Abstractions

Status: proposed
Date: 2025-02-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`

## Context

- Route handling and view composition across private workspace segments and public session explore views require consistent navigation abstractions and lifecycle coordination.
- Analysis of application route entrypoints reveals recurring imports of next and next/navigation coordinating view presentation and navigation state.
- Standardizing on the framework navigation module prevents divergent client-side routing implementations across different functional areas.

## Problem Statement

Without a standardized navigation module, distinct route handlers across authenticated workspaces and public sessions risk adopting divergent navigation primitives and parameter extraction patterns, causing inconsistent route state transitions and fragmented view lifecycle management.

## Decision

1. MUST_NOT: Components MUST NOT bypass framework navigation abstractions by directly manipulating browser window location or history objects for internal application routing.

## Policy Block

- MUST_NOT Components MUST NOT bypass framework navigation abstractions by directly manipulating browser window location or history objects for internal application routing.

In scope:
- Application route entrypoints and interactive components requiring programmatic navigation or route parameter access.
- Shared presentation and explorer components deployed across authenticated and public route trees.

Out of scope:
- Pure presentation components and styling primitives that operate independently of route state.
- External web links and third-party redirect handoffs that leave the application boundary.

## Rationale

- Direct evidence from route modules demonstrates consistent reliance on the Next.js navigation module across both workspace and public domains.
- Centralizing on framework navigation ensures consistent route transition handling and uniform parameter extraction across route hierarchies.
- Eliminating disparate routing mechanisms avoids synchronization bugs between browser history states and rendered view components.

## Consequences

Positive:
- Provides unified route transition patterns and parameter consumption across authenticated and public application trees.
- Enables consistent integration with framework-level caching, prefetching, and view transitions.
- Reduces architectural fragmentation by avoiding custom routing wrappers or ad-hoc browser location manipulations.

Negative:
- Couples route-level components directly to the framework navigation runtime and its lifecycle semantics.
- Requires diligent lock-version grounding to ensure invoked navigation hooks and methods align with the resolved framework release.

## Alternatives

- Custom browser history abstraction (rejected)
  Rejected because: Creating custom abstractions over browser history increases maintenance overhead, lacks framework lifecycle integration, and deviates from standard patterns observed across route entrypoints.
  When valid: When building standalone, framework-agnostic client libraries outside web application containers.
- Standard HTML anchor links for all route transitions (rejected)
  Rejected because: Native browser links trigger full page reloads, precluding dynamic client-side parameter handling and preserved application state.
  When valid: When navigating to static external resources or independent external domains.

## Risks

- Framework API discrepancies between minor releases could cause runtime navigation errors if version grounding is neglected.
  Mitigation: Enforce strict dependency verification against the repository lock artifact and validate navigation API contracts against version documentation.
  Owner: Frontend engineering team
- Deeply nesting navigation hooks within shared presentation components creates tight coupling to the framework runtime.
  Mitigation: Promote route parameter extraction and transition dispatch at route entrypoints, passing plain callbacks to leaf presentation components.
  Owner: Frontend engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Ensure route entrypoints consistently delegate view rendering to domain presentation components while encapsulating route parameter parsing.
- Reference the resolved framework documentation to confirm API availability for navigation hooks and functions before incorporating them into new route segments.

## Continuation Context


Verify commands:
- # Discover the project build configuration and run type verification
- # Discover and run repository linter to verify routing import boundaries

Accept when:
- Static type verification passes without errors across all route entrypoints importing navigation primitives.
- Linter rules confirm that internal routing references use framework navigation rather than direct window location modifications.

## Enforcement

- Verified by: Automated continuous integration checks executing repository type verification and linting.
- Verified by: Peer code review evaluating route component structure and navigation hook usage.
- Violation handling: Pull requests containing disallowed routing abstractions or direct browser history manipulation are blocked pending remediation.
- Exception process: Architectural exceptions require written rationale approved by the frontend engineering leads and documented in the repository decision logs.