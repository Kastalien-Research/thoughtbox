---
version: 2
name: 61a1d38f-2a68-45d6-8d5d-dc844f89a71d-next-navigation-module-adoption-for-application-routing-and-url-state-management-application-standardize-next-navigation-programmatic-routing
description: "next/navigation Module Adoption for Application Routing and URL State Management: Application Standardize Next Navigation Programmatic Routing"
metadata:
  actual:
    adr_id: 61a1d38f-2a68-45d6-8d5d-dc844f89a71d
    status: accepted
    candidate_group_id: 00700bca-1300-47f6-8aa1-84178082f0b8
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/components/**
      - src/lib/stripe/**
---

# next/navigation Module Adoption for Application Routing and URL State Management: Application Standardize Next Navigation Programmatic Routing

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`
- `src/components/**`
- `src/lib/stripe/**`

## Context

- The web application requires consistent client-side and server-side navigation, URL state synchronization, and programmatic routing across workspace views, sessions, and settings.
- Evidence across 23 files confirms ubiquitous reliance on next/navigation alongside framework link components for route transitions, search parameter extraction, and action redirects.
- Disparate routing techniques or direct browser window manipulation lead to state desynchronization, uncoordinated transitions, and compromised server rendering compatibility.

## Problem Statement

Web applications with complex workspace routing, deep-linkable session inspection, and dynamic query parameter state require a unified, framework-native navigation architecture. Inconsistent URL handling, mixed routing libraries, or reliance on raw browser window location objects causes route state desynchronization, breaks server rendering hydration, and fragments navigation logic across client and server boundaries.

## Decision

1. MUST: The application MUST standardize on next/navigation for all programmatic routing, route parameter resolution, URL query manipulation, and redirect flows across server and client components.

## Policy Block

- MUST The application MUST standardize on next/navigation for all programmatic routing, route parameter resolution, URL query manipulation, and redirect flows across server and client components.

In scope:
- All application route pages, layout wrappers, and navigation components requiring routing or URL state manipulation
- Server action modules that perform programmatic redirection upon completing mutations
- Interactive client components synchronizing search query parameters with user interface state

Out of scope:
- External web links and static anchor navigations to third-party domains
- Pure utility functions that process URL strings without interacting with framework runtime routing

Exceptions:
- EXC-20-001: A browser-level full page reload or external authentication redirect requires direct window navigation

## Rationale

- Static analysis across 23 application files demonstrates unified adoption of next/navigation across routes, actions, and navigation components.
- Standardizing on next/navigation ensures seamless synchronization between server-rendered route shells and client-side interactive state such as search parameters.
- Eliminating disparate routing mechanisms guarantees predictable browser history transitions, prevents hydration mismatches, and simplifies navigational maintenance.

## Consequences

Positive:
- Provides a unified, framework-native routing and query parameter manipulation API across all application views.
- Ensures consistency between server action redirects and client-side route transitions without hydration mismatches.
- Centralizes URL state handling, enabling predictable deep linking and state persistence across workspace sessions.

Negative:
- Couples application routing and search parameter handling tightly to the specific framework navigation module.
- Requires client components consuming dynamic search parameters to establish appropriate suspense boundaries to prevent de-optimizing static page rendering.

## Alternatives

- Direct browser window location and history API manipulation (rejected)
  Rejected because: Bypasses framework rendering lifecycle, causes state desynchronization, and breaks server-side rendering hydration.
  When valid: Valid only in standalone vanilla script environments lacking a unified application framework runtime.
- Legacy framework router module from historical architecture (rejected)
  Rejected because: Incompatible with current application directory structure and server component streaming boundaries.
  When valid: Valid only in legacy application routes maintained under older framework directory paradigms.

## Risks

- Unbounded reading of search parameters in client components may cause unintended fallback rendering or de-optimization.
  Mitigation: Wrap client search parameter readers in appropriate boundary wrappers and isolate URL state reads to designated consumer components.
  Owner: Web Engineering Team
- Framework version updates may introduce subtle behavioral changes to navigation hooks or redirect throwing mechanisms.
  Mitigation: Strictly adhere to the lock-version grounding policy and verify behavior against official version documentation before updating dependencies.
  Owner: Frontend Infrastructure Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Discover the project dependency manifest and lock artifact to confirm the exact resolved framework navigation package version.
- Ensure search parameter mutations are composed using standard URL search parameter primitives before triggering navigation updates.
- Organize server action redirection so that navigation transitions occur after successful database operations and validations.

## Continuation Context


Verify commands:
- Discover and run the project linting and static analysis script to verify that routing imports strictly use the approved navigation module.
- Discover and run the project type-checking script to confirm navigation hooks and parameters comply with framework type definitions.
- Discover and run the project automated test suite to ensure navigation transitions, redirects, and query parameters function as expected.

Accept when:
- Static analysis confirms zero unauthorized routing imports or direct browser history mutations across the codebase.
- All navigation hook calls and redirect functions pass repository type-checking without diagnostic errors.
- Automated tests confirm route navigation and search parameter synchronization behave correctly across all views.

## Enforcement

- Verified by: Automated continuous integration lint checks and static import verification rules
- Verified by: Peer code review for all new route additions, server actions, and navigation components
- Violation handling: Pull requests introducing direct browser window routing or superseded navigation imports are blocked from merge.
- Violation handling: Violations detected during code review must be refactored to use approved navigation primitives before approval.
- Exception process: Submit an architectural exception request documenting why framework navigation primitives cannot satisfy the requirements.
- Exception process: Obtain formal sign-off from the technical lead and record the exception rationale in repository documentation.