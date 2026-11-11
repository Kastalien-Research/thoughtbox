---
version: 2
name: eb6fe023-cdbc-4896-8128-caacd3f75f5f-centralizing-repository-timeline-processing-via-the-lib-repo-timeline-module-discover-repository-lock-artifact-verify-exact
description: "Centralizing Repository Timeline Processing via the @/lib/repo/timeline Module: Discover Repository Lock Artifact Verify Exact"
metadata:
  actual:
    adr_id: eb6fe023-cdbc-4896-8128-caacd3f75f5f
    status: accepted
    candidate_group_id: 35377cfb-bd4a-4feb-b920-dd5c46bc2657
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Centralizing Repository Timeline Processing via the @/lib/repo/timeline Module: Discover Repository Lock Artifact Verify Exact

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`

## Context

- Repository management views require consistent timeline representations across server-side route loaders and client-side graph rendering interfaces.
- Directly coupling timeline calculation logic to individual user interface components risks behavioral inconsistency and duplicate calculation overhead.
- Static analysis detected shared reliance on the @/lib/repo/timeline internal module across distinct server and client component boundaries.

## Problem Statement

Repository views require consistent timeline and graph structures across initial server rendering and interactive client visualization. Without a single domain module governing timeline calculations, transformation logic can diverge across application boundaries, resulting in mismatched state representations and redundant implementations.

## Decision

1. MUST: MUST discover the repository lock artifact and verify the exact resolved dependency versions before integrating or modifying versioned packages supporting timeline visualization.

## Policy Block

- MUST MUST discover the repository lock artifact and verify the exact resolved dependency versions before integrating or modifying versioned packages supporting timeline visualization.

In scope:
- All application components, route handlers, and presentation views responsible for processing or displaying repository timeline data.

Out of scope:
- Generic workspace administration views, authentication workflows, or repository operations that do not process historical timeline data.

## Rationale

- Encapsulating timeline parsing and graph layout logic within @/lib/repo/timeline provides a single source of truth across server and client boundaries.
- Decoupling timeline computation from presentation concerns enables independent testing and optimization of complex repository event sorting and branch visualization.
- Observed import patterns across both server entry points and client visualization components substantiate that this module functions as the shared domain core for repository timeline data.

## Consequences

Positive:
- Single source of truth for timeline calculations eliminates synchronization errors between server and client views.
- Enables modular unit testing of timeline algorithms isolated from visual rendering concerns.
- Improves client component maintainability by offloading complex data aggregation to a dedicated domain module.

Negative:
- Creates a shared dependency contract that requires coordinated updates across server and client layers.
- Developers must ensure the module remains platform-agnostic to prevent bundling server dependencies into client runtimes.

## Alternatives

- Embedding timeline transformation logic directly inside UI view components (rejected)
  Rejected because: Duplicating timeline transformation logic across server controllers and client graph views increases maintenance overhead and leads to inconsistent state rendering.
  When valid: Only viable in single-tier applications where timeline visualization is confined to one isolated component.
- Delegating all timeline computation dynamically to an external API endpoint (rejected)
  Rejected because: Introduces unnecessary network latency and serialization overhead for operations that can be performed in-memory on shared data models.
  When valid: Valid when timeline calculation requires access to heavy server-side compute or databases not available within the application runtime.

## Risks

- Shared timeline module logic could inadvertently import platform-specific dependencies that fail in client environments.
  Mitigation: Enforce strict separation between pure timeline calculation functions and platform-specific I/O or rendering bindings.
  Owner: Engineering Team
- Changes to timeline data contracts can simultaneously break server route rendering and client interactive visualization.
  Mitigation: Establish comprehensive integration tests covering shared timeline contracts across all consuming boundaries.
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
- Ensure timeline module data transformation functions remain free of server-only or client-only side effects so they remain safely importable across all application tiers.
- Structure timeline graph data models into immutable data representations to facilitate client-side rendering optimization.

## Continuation Context


Verify commands:
- Discover and run the project repository static analysis script to verify module import constraints.
- Execute the repository test runner discovered from the dependency manifest to validate timeline computation behavior.
- Inspect the build resolution artifacts to verify that module imports resolve without circular dependencies.

Accept when:
- Static analysis validates that repository timeline operations import exclusively from the dedicated timeline module.
- Automated test suites pass without regressions across server and client timeline consumers.

## Enforcement

- Verified by: Automated static analysis checks enforcing architectural import boundaries.
- Verified by: Peer code review during pull request evaluations.
- Violation handling: Pull requests introducing direct timeline parsing outside the designated module will be rejected.
- Violation handling: Architectural boundary violations must be refactored prior to merging.
- Exception process: Exceptions require documented justification and approval from repository domain leads.