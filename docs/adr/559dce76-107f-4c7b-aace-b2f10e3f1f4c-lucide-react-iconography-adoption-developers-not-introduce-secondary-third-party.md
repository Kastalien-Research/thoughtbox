---
version: 2
name: 559dce76-107f-4c7b-aace-b2f10e3f1f4c-lucide-react-iconography-adoption-developers-not-introduce-secondary-third-party
description: "Lucide React Iconography Adoption: Developers Not Introduce Secondary Third Party"
metadata:
  actual:
    adr_id: 559dce76-107f-4c7b-aace-b2f10e3f1f4c
    status: accepted
    candidate_group_id: 5eabd316-ca20-415c-8e0e-ba9fa6a57805
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
      - src/components/session-area/**
---

# Lucide React Iconography Adoption: Developers Not Introduce Secondary Third Party

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`
- `src/components/session-area/**`

## Context

- User interface surfaces across workspace dashboards, public pages, and session diagnostic tools require a consistent visual language and iconography system.
- Analysis across multiple page routes and session presentation components demonstrates uniform adoption of Lucide React component icons.
- Standardizing on a unified icon component library prevents visual fragmentation, eliminates redundant vector definitions, and guarantees tree-shaking compatibility across client and server boundaries.

## Problem Statement

Lack of a standardized iconography library leads to visual inconsistency across application surfaces, duplicate inline vector markup, bloated client bundles, and unreliable accessibility support for screen readers.

## Decision

1. MUST_NOT: Developers MUST NOT introduce secondary third-party icon libraries or inline raw SVG vector markup for iconography available within the adopted library.

## Policy Block

- MUST_NOT Developers MUST NOT introduce secondary third-party icon libraries or inline raw SVG vector markup for iconography available within the adopted library.

In scope:
- User interface visual indicators, status glyphs, and decorative icons rendered within application pages and client presentation components.
- Interactive buttons and disclosure elements incorporating visual icon elements.

Out of scope:
- Complex interactive multi-layered vector illustrations and animated marketing diagrams.
- Non-visual application modules, server data processing pipelines, and data access layers.

Exceptions:
- EXC-20-001: A custom proprietary brand logo or multi-color illustration is required that does not exist within the adopted icon library.

## Rationale

- Observed evidence across five distinct route pages and session inspection components confirms widespread reliance on Lucide React for application iconography.
- Adopting a single unified icon library maintains aesthetic consistency across diverse application views while preventing interface styling drift.
- Component-based icon definitions integrate cleanly with modern bundlers, allowing unused icons to be tree-shaken and minimizing asset overhead in client bundles.

## Consequences

Positive:
- Enforces a cohesive visual identity and uniform iconography styling across both route views and diagnostic inspection panels.
- Ensures optimal client bundle sizes by leveraging named imports that allow bundlers to tree-shake unused icons.
- Standardizes accessibility practices through predictable application of accessibility attributes on decorative iconography.

Negative:
- Couples user interface components to the component API and icon taxonomy of a specific external iconography vendor.
- Upgrading across major releases may introduce renamed or deprecated icon identifiers that require refactoring across consuming components.

## Alternatives

- Direct inline raw SVG markup embedded directly within presentation components (rejected)
  Rejected because: Inline SVG markup duplicates vector definitions across files, bloats component templates, and increases maintenance overhead when icon styling or shapes change.
  When valid: When rendering bespoke, non-reusable brand graphics or dynamic vector animations that require direct manipulation of individual path elements.
- Consolidated SVG sprite sheets referenced via external asset identifiers (rejected)
  Rejected because: Sprite sheets require extra asset pipeline steps, restrict runtime utility styling flexibility, and do not integrate naturally into component-based lifecycles.
  When valid: In architectures lacking modern component bundlers or where strict external asset HTTP caching is mandated.

## Risks

- Icon component names or property signatures may change between library upgrades, causing compilation or rendering failures.
  Mitigation: Pin exact versions using lock artifacts, inspect version documentation before upgrades, and execute automated type checks to catch renamed exports.
  Owner: Frontend Engineering Team
- Developers may omit accessibility attributes on icon elements, resulting in poor accessibility experiences for assistive technologies.
  Mitigation: Incorporate static linting and component tests that enforce the presence of aria-hidden on decorative icons or accessible labels on standalone icon triggers.
  Owner: Frontend Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Import icon components using individual named imports from the root package to ensure unused icons are eliminated during bundle optimization.
- Apply dimensional and coloration utility classes directly to the icon components to enable flexible scaling and contextual theme color inheritance.

## Continuation Context


Verify commands:
- Discover the repository static analysis script and execute it across all presentation components to verify named icon imports and property usage.
- Discover and run the project type checker to ensure all referenced icon components match the resolved library types.
- Discover and execute the component test suite to confirm icon rendering and accessibility attribute presence.

Accept when:
- Static analysis and type verification pass without unresolved icon module imports or property errors.
- All decorative icon component instances declare appropriate accessibility attributes or accessible text fallbacks.
- No unauthorized secondary icon libraries or redundant raw SVG glyph definitions are introduced into application components.

## Enforcement

- Verified by: Automated continuous integration checks executing static analysis and type checking across all pull requests.
- Verified by: Peer code reviews ensuring compliance with iconography selection, sizing conventions, and accessibility declarations.
- Violation handling: Pull requests introducing unapproved icon libraries or omitting required accessibility attributes on decorative icons will fail automated checks and require remediation before merge.
- Exception process: Exceptions for custom proprietary brand symbols or unique graphical assets must be reviewed and approved by design system maintainers before inclusion.