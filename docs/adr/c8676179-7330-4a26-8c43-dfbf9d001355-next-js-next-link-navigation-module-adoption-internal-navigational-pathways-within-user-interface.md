---
version: 2
name: c8676179-7330-4a26-8c43-dfbf9d001355-next-js-next-link-navigation-module-adoption-internal-navigational-pathways-within-user-interface
description: "Next.js next/link Navigation Module Adoption: Internal Navigational Pathways Within User Interface"
metadata:
  actual:
    adr_id: c8676179-7330-4a26-8c43-dfbf9d001355
    status: accepted
    candidate_group_id: 06fb8bae-c34c-430e-b9ad-4426b83ecdc4
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/components/**
---

# Next.js next/link Navigation Module Adoption: Internal Navigational Pathways Within User Interface

Status: proposed
Date: 2025-02-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`
- `src/components/**`

## Context

- The web application user interface spans multiple routing domains including public marketing views, authentication flows, documentation hierarchies, and authenticated workspace views.
- Standard unmanaged HTML anchor tags initiate full browser document reloads, degrading responsiveness and clearing client runtime state.
- Static analysis across 31 presentation files demonstrates consistent imports and rendering of the declarative Link component from next/link.

## Problem Statement

Uncoordinated navigation implementations across user interface components cause inconsistent routing behavior, accidental full page reloads, loss of client cache state, and degraded user experience. The application requires an authoritative, declarative client-side routing convention that guarantees seamless page transitions and automatic viewport prefetching across all internal routes.

## Decision

1. MUST: All internal navigational pathways within user interface components and layouts MUST utilize the declarative Link component from next/link to execute client-side route transitions.

## Policy Block

- MUST All internal navigational pathways within user interface components and layouts MUST utilize the declarative Link component from next/link to execute client-side route transitions.

In scope:
- All user interface components, layouts, templates, and view panels rendering internal navigation links within the web application.

Out of scope:
- Outbound hyperlinks targeting external third-party origins.
- Direct browser asset downloads and non-HTML resource links.

## Rationale

- Adopting next/link across the presentation layer guarantees client-side single-page transitions, preventing full document reloads and preserving client state.
- Declarative Link components automatically coordinate viewport-based prefetching for target routes, lowering interaction-to-paint latency.
- Empirical evidence across 31 files demonstrates pervasive adoption across both server-rendered layouts and client-interactive components, establishing an authoritative pattern.

## Consequences

Positive:
- Eliminates full document reloads during internal routing, preserving client-side application state and reducing perceived latency.
- Automates background prefetching of target route bundles visible within the browser viewport.
- Standardizes navigation property validation and accessible anchor rendering across both server and client components.

Negative:
- Couples internal link markup across all interface templates directly to the specific framework navigation module.
- Automated viewport prefetching can increase background network request volume on views with dense link collections.

## Alternatives

- Standard unmanaged HTML anchor elements for internal navigation (rejected)
  Rejected because: Triggers complete browser document reloads on internal route transitions, resetting client state and introducing visible screen flashing.
  When valid: Outbound hyperlinks referencing external third-party origins or direct non-HTML asset downloads.
- Imperative programmatic navigation via framework router hooks exclusively (rejected)
  Rejected because: Bypasses declarative anchor markup, degrading accessibility compliance, disabling standard browser context menus, and preventing automated viewport prefetching.
  When valid: Event handlers requiring prerequisite asynchronous mutations or conditional validation prior to executing a redirect.

## Risks

- High link density within complex views triggering excessive background prefetch network requests.
  Mitigation: Configure explicit prefetch parameters on Link instances situated within high-density lists or non-critical viewport regions.
  Owner: engineering team
- Improper composition of interactive child elements within Link components causing invalid DOM structures and broken accessibility semantics.
  Mitigation: Enforce automated static accessibility linting rules to validate anchor attribute forwarding and interactive nesting constraints.
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
- Verify that all route destination properties bound to Link instances match defined route path conventions in the application routing hierarchy.
- Ensure wrapped interactive custom elements forward anchor attributes correctly to maintain accessibility tree fidelity and viewport observation.

## Continuation Context


Verify commands:
- Discover the static analysis validation script from the project manifest and execute it to verify all internal navigation references utilize the framework routing component.
- Discover the interface compilation and type verification script from the dependency manifest and execute it to confirm routing properties satisfy framework type constraints.
- Discover the repository search utility and inspect presentation files to ensure raw anchor tags are not used for internal application paths.

Accept when:
- Static analysis and interface compilation checks execute without errors or warnings regarding internal navigation component usage or route properties.
- All internal route transitions execute as client-side single-page transitions without initiating full document reloads.

## Enforcement

- Verified by: Automated static analysis lint rules verifying that internal route links exclusively instantiate the framework navigation component.
- Verified by: Peer code review required for all interface pull requests modifying routing pathways or navigation components.
- Violation handling: Continuous integration builds fail when unmanaged anchor tags are detected targeting internal application routes.
- Violation handling: Pull requests introducing direct window navigation mutations for internal routes are blocked until refactored.
- Exception process: Teams requiring alternative navigation approaches must document specific technical constraints and obtain formal approval from the architecture review board prior to implementation.