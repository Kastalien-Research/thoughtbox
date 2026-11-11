---
version: 2
name: dbb321b8-f6a4-4bc8-b35e-d77c3cc6e982-next-js-next-navigation-module-adoption-use-next-its-navigation-module-standard
description: "Next.js next/navigation Module Adoption: Use Next Its Navigation Module Standard"
metadata:
  actual:
    adr_id: dbb321b8-f6a4-4bc8-b35e-d77c3cc6e982
    status: accepted
    candidate_group_id: 01c24c1f-9c07-493b-9d67-f8e6a4576b6a
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Next.js next/navigation Module Adoption: Use Next Its Navigation Module Standard

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`

## Context

- Application user interfaces require consistent client-side routing, route parameter access, and navigation primitives across workspace and session views.
- Multiple route page components in the application web layer observe dependencies on the Next.js core library and its dedicated navigation module.
- Standardizing navigation through framework-provided modules prevents fragmentation and ensures predictable client-side navigation transitions.

## Problem Statement

Inconsistent navigation techniques and disparate routing imports across route pages create architectural drift, state desynchronization, and unreliable client view transitions. A standardized framework-level navigation convention is required to govern how route segment components handle navigation and parameter resolution.

## Decision

1. MUST: MUST use Next.js and its next/navigation module as the standard routing and navigation interface across application route pages.

## Policy Block

- MUST MUST use Next.js and its next/navigation module as the standard routing and navigation interface across application route pages.

In scope:
- Application route page components requiring route segment resolution, redirects, and client navigation transitions.
- Presentation components embedded within route segments that interact with navigation state.

Out of scope:
- Framework-agnostic utility functions, view models, and domain logic that have no dependency on user interface routing.
- Backend services or server-side background processors operating outside the web presentation layer.

## Rationale

- Evidence from multiple session route pages demonstrates consistent reliance on Next.js and its navigation module alongside localized client creation and presentation components.
- Adopting the framework navigation module guarantees native compatibility with route segment lifecycles, nested layouts, and client-side view caching.
- Centralizing navigation calls on the established framework module eliminates redundant routing packages and protects route integrity.

## Consequences

Positive:
- Unified and declarative navigation handling across all application route pages.
- Seamless integration with framework segment routing, client cache, and layout hierarchies.
- Reduced bundle overhead and dependency complexity by utilizing core framework capabilities.

Negative:
- Direct architectural coupling to the specific framework navigation paradigm and lifecycle.
- Maintenance overhead when upstream framework revisions alter navigation hook signatures or behavior.

## Alternatives

- Native browser location and history API manipulation (rejected)
  Rejected because: Bypasses framework route state synchronization, risks full page reloads, and degrades client-side routing performance.
  When valid: Valid only in external redirection scenarios that exit the framework application entirely.
- Third-party routing and navigation abstractions (rejected)
  Rejected because: Introduces redundant external dependencies and fragments routing patterns when the core framework already provides dedicated navigation modules.
  When valid: Valid only when migrating across distinct framework ecosystems or running micro-frontends with disparate routing runtimes.

## Risks

- Upgrading the core framework may introduce breaking changes or deprecations to routing and navigation APIs.
  Mitigation: Strictly adhere to the lock-version grounding process and review framework changelogs prior to updating resolved dependencies.
  Owner: Engineering team
- Over-coupling deep presentation components to framework navigation primitives complicates component reuse and unit testing.
  Mitigation: Encapsulate navigation logic within top-level route segment pages and pass navigational callbacks or decoupled properties down to presentation components.
  Owner: Engineering team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Encapsulate route parameter parsing and error handling at the route boundary before delegating data to child view models or presentation headers.
- Ensure navigation transitions coordinate with data client instances and preserve workspace context across nested session views.

## Continuation Context


Verify commands:
- Discover and execute the repository type-checking script to validate that all navigation imports and route signatures comply with the framework module definitions.
- Discover and run the project linter and static analysis suite to verify that route page components adhere to framework navigation rules.
- Discover and execute the automated test runner to ensure route rendering and navigation transitions execute without runtime errors.

Accept when:
- Static type analysis passes with zero type errors across all route page components utilizing the navigation module.
- Linter and structural analysis confirm that navigation occurs exclusively through the authorized framework module.
- Integration test suites verify that route rendering and navigation parameter handling behave as expected without unhandled routing exceptions.

## Enforcement

- Verified by: Automated continuous integration pipelines executing type checks and static linting rules against import declarations.
- Verified by: Peer code review verifying that route pages adhere to framework navigation standards and avoid bespoke routing workarounds.
- Violation handling: Pull requests introducing unauthorized routing abstractions or non-standard navigation patterns are blocked until refactored to standard framework modules.
- Exception process: Architectural exceptions require a documented proposal detailing why framework navigation primitives cannot fulfill the requirement, approved by the engineering architecture team.