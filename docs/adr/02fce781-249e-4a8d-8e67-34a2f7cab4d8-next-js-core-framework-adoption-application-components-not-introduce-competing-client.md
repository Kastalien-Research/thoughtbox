---
version: 2
name: 02fce781-249e-4a8d-8e67-34a2f7cab4d8-next-js-core-framework-adoption-application-components-not-introduce-competing-client
description: "Next.js Core Framework Adoption: Application Components Not Introduce Competing Client"
metadata:
  actual:
    adr_id: 02fce781-249e-4a8d-8e67-34a2f7cab4d8
    status: accepted
    candidate_group_id: a455d5e5-139d-42ba-a628-cdc1136a84b0
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - next.config.ts
      - src/app/**
---

# Next.js Core Framework Adoption: Application Components Not Introduce Competing Client

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `next.config.ts`
- `src/app/**`

## Context

- The web application requires structured server-evaluated rendering and unified page routing across multiple surface areas.
- Multiple application views across public documentation and workspace domains consistently import core framework modules for navigation and component layout.
- Consolidating page routing and rendering on a unified framework library eliminates bespoke rendering lifecycles and fragmented data retrieval layers.

## Problem Statement

The web application requires a standardized framework architecture for route handling, layout orchestration, and server-evaluated view rendering across diverse operational domains without introducing fragmented routing libraries.

## Decision

1. MUST_NOT: Application components MUST NOT introduce competing client-side or server-side routing libraries within the web application boundary.

## Policy Block

- MUST_NOT Application components MUST NOT introduce competing client-side or server-side routing libraries within the web application boundary.

In scope:
- All page components and route definitions within the web application service.
- All navigation and link orchestration logic across public and authenticated application areas.

Out of scope:
- Independent background workers and non-web services that do not render user interface endpoints.
- Utility scripts and data migration routines executed outside the web application runtime.

## Rationale

- Analysis of 34 application modules demonstrates widespread adoption of Next.js core modules for route handling and navigation.
- Standardizing on framework-provided routing and layout mechanisms ensures uniform server-side evaluation and eliminates redundant view routing solutions.
- Centralizing on core framework conventions simplifies maintenance, upgrades, and developer onboarding across workspace and public domains.

## Consequences

Positive:
- Establishes consistent route composition and rendering patterns across all application views.
- Enables server-side data resolution and declarative layouts without custom orchestration logic.
- Standardizes navigation and link handling across public and authenticated workspace surfaces.

Negative:
- Couples application route structure and component rendering lifecycles to framework conventions.
- Requires explicit client boundaries when utilizing browser-specific APIs within server component trees.
- Upgrades to framework dependencies require coordinated audit of locked version resolution artifacts.

## Alternatives

- Custom routing and rendering framework (rejected)
  Rejected because: Increases ongoing maintenance overhead and fails to utilize established server-rendering primitives and ecosystem conventions.
  When valid: When runtime environments prohibit standard framework execution models or require proprietary embedding.
- Client-only single-page application routing (rejected)
  Rejected because: Sacrifices server-side data fetching and unified route layouts observed across application pages.
  When valid: When applications run entirely offline or without server infrastructure.

## Risks

- Breaking changes across major framework releases could impact route behavior or navigation contracts.
  Mitigation: Audit locked dependency artifacts and test route modules against official framework release notes prior to upgrading.
  Owner: engineering team
- Accidental introduction of client runtime dependencies into server-rendered component trees.
  Mitigation: Enforce strict linting rules and component isolation to prevent client-only dependencies in server-evaluated modules.
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
- Structure route definitions hierarchically using framework conventions to maintain clear boundaries between server components and interactive client components.
- Colocate page layout definitions and data fetching logic to preserve cohesive data flow within each route boundary.

## Continuation Context


Verify commands:
- Discover and execute the project compilation script from the repository manifest to verify route compilation integrity.
- Discover and execute the repository type-checking script to ensure all framework navigation and routing contracts are satisfied.

Accept when:
- The project build script executes successfully with zero compilation errors across all route modules.
- Static type verification passes without errors for all framework routing and navigation imports.
- The resolved dependency version matches the authoritative lock artifact in the repository.

## Enforcement

- Verified by: Automated continuous integration pipeline executing project verification and linting scripts.
- Verified by: Mandatory peer code review for all new route additions and routing module import updates.
- Violation handling: Pull request automated checks block merge on unauthorized routing libraries or broken framework contracts.
- Violation handling: Engineering team rejects pull requests introducing divergent routing mechanisms into application route directories.
- Exception process: Submit architectural exception request documenting requirements that cannot be met by the framework runtime.
- Exception process: Obtain formal approval from the engineering architecture group before integrating alternative routing mechanisms.