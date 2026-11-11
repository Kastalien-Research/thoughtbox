---
version: 2
name: b75b6c94-db3b-4e27-abb8-43a39e2da183-date-fns-library-adoption-for-temporal-operations-direct-place-mutations-built-temporal-instances
description: "date-fns Library Adoption for Temporal Operations: Direct Place Mutations Built Temporal Instances"
metadata:
  actual:
    adr_id: b75b6c94-db3b-4e27-abb8-43a39e2da183
    status: accepted
    candidate_group_id: 969dd436-fd3c-425e-8b4d-6e13c3009579
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/components/session-area/**
      - src/lib/session/**
---

# date-fns Library Adoption for Temporal Operations: Direct Place Mutations Built Temporal Instances

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`
- `src/components/session-area/**`
- `src/lib/session/**`

## Context

- Multiple architectural layers including view-model mappers, server-rendered analytics pages, and interactive client components require date calculations, timeline bucketing, and timestamp formatting.
- Relying on disparate date manipulation approaches or mutable built-in temporal objects introduces parsing discrepancies, timezone edge cases, and runtime mutation bugs.
- Static code analysis demonstrates standardized adoption of modular date-fns functional imports across view models, route handlers, and interface presentation components.

## Problem Statement

Inconsistent date and time manipulation across server-rendered views, client tables, and session calculation layers causes fragile time formatting, mutable object bugs, and duplicated utility logic. A single, immutable, tree-shakeable date utility library is required to govern all temporal operations across the web application.

## Decision

1. MUST_NOT: Direct in-place mutations of built-in temporal instances MUST NOT be performed; all transformations MUST produce new temporal values via pure functional operations.

## Policy Block

- MUST_NOT Direct in-place mutations of built-in temporal instances MUST NOT be performed; all transformations MUST produce new temporal values via pure functional operations.

In scope:
- All domain view models and data presentation mappers executing date or time calculations.
- All server-side route pages rendering timeline or usage analytics.
- All interactive client components rendering localized timestamps or historical intervals.

Out of scope:
- Low-level database communication layers where native database timestamp primitives are transferred without transformation.
- External telemetry payloads that transmit raw ISO string values without local arithmetic or formatting.

## Rationale

- Evidence across server pages, client components, and view-model helpers confirms consistent adoption of date-fns as the shared temporal utility.
- The pure-function design of date-fns guarantees immutability, eliminating state mutation bugs common with built-in temporal objects.
- A modular functional architecture supports dead-code elimination, minimizing client-side script payload sizes compared to monolithic date frameworks.

## Consequences

Positive:
- Guarantees functional immutability and predictability for all date arithmetic, parsing, and formatting logic.
- Enables granular dead-code elimination and optimal client-side bundle efficiency through pure function exports.
- Eliminates divergent date calculations and formatting discrepancies across server-rendered routes and client components.

Negative:
- Developers must explicitly compose individual functional primitives rather than invoking chained instance methods.
- Inconsistent import styles could lead to accidental inclusion of full library namespaces if modular path imports are bypassed.
- Requires disciplined tracking of modular functional signatures across library major upgrades.

## Alternatives

- Native ECMAScript Date object without helper libraries (rejected)
  Rejected because: Native Date mutates state in place, exhibits inconsistent parsing behaviors across runtime environments, and lacks comprehensive formatting and arithmetic primitives.
  When valid: Valid only for trivial timestamp acquisitions without formatting, arithmetic, or timezone-sensitive transformations.
- Monolithic temporal management library with object-wrapped instances (rejected)
  Rejected because: Monolithic instance-based date libraries inhibit tree-shaking, increase client bundle overhead, and rely on mutable class wrapper abstractions.
  When valid: Valid when legacy codebase contracts mandate global mutable date wrappers.

## Risks

- Developers importing full library namespaces instead of modular functional primitives, increasing client bundle size.
  Mitigation: Enforce named functional imports via static lint rules to ensure only referenced date-fns utilities are bundled.
  Owner: Frontend Engineering Team
- Inconsistent handling of UTC versus localized timestamps between server rendering and client hydration.
  Mitigation: Document standard parsing strategies and verify temporal functions using automated test suites across simulated client and server environments.
  Owner: Core Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Ensure all imports from date-fns use named modular bindings to maximize tree-shaking efficiency in client bundles.
- Encapsulate complex domain-specific temporal aggregations and lane assignments within dedicated domain view-model modules.

## Continuation Context


Verify commands:
- Discover and execute the project dependency analysis script to verify date-fns is the sole temporal library present in manifests.
- Discover and execute the repository linter to verify all date-fns imports utilize modular named specifiers.
- Discover and execute the automated test runner to ensure all temporal view-model transformations pass test suites.

Accept when:
- All temporal manipulation, formatting, and calculation functions import modular utilities from date-fns across client components, server pages, and domain view models.
- Static analysis and dependency verification pass with zero unapproved third-party temporal calculation libraries present in the dependency manifest.
- The exact installed version of date-fns matches the resolved version documented in the repository lock artifact.

## Enforcement

- Verified by: Automated dependency scanning in continuous integration pipelines checking for unauthorized date libraries.
- Verified by: Import boundary linting rules enforcing modular date-fns imports across client and server source files.
- Verified by: Peer review during code integration to ensure date calculations remain pure and immutable.
- Violation handling: Continuous integration checks fail when unapproved date utility packages or direct native Date mutations are detected.
- Violation handling: Pull requests introducing non-standard temporal libraries must be revised to use standard date-fns utilities before merging.
- Exception process: Submit an architecture waiver request detailing why date-fns functional primitives cannot satisfy the specific temporal requirement.
- Exception process: Require review and sign-off by the lead application architect prior to merging alternative temporal utilities.
- Exception process: Document approved exceptions with an expiration date and tracking issue for future reconciliation.