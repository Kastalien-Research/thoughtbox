---
version: 2
name: c3c521c1-dd9e-4445-a2e4-ac2e1f5193a9-adoption-of-lib-session-badge-styles-module-for-centralized-session-badge-styling-export-utilities-rendering-badge-representations-coordinate
description: "Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Export Utilities Rendering Badge Representations Coordinate"
metadata:
  actual:
    adr_id: c3c521c1-dd9e-4445-a2e4-ac2e1f5193a9
    status: accepted
    candidate_group_id: bfe6a831-5d4c-417b-b615-1691bf50b5a8
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/components/session-area/**
      - src/lib/session/**
---

# Adoption of `@/lib/session/badge-styles` Module for Centralized Session Badge Styling: Export Utilities Rendering Badge Representations Coordinate

Status: proposed
Date: 2025-02-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`
- `src/components/session-area/**`
- `src/lib/session/**`

## Context

- Multiple session presentation components and export formatters require consistent badge styling and status token mapping across diverse rendering surfaces.
- Static analysis identifies repeated imports of the internal `@/lib/session/badge-styles` module across dashboard views, table shells, thought rows, thought cards, and export formatters.
- Centralizing badge styling definitions into a dedicated session domain module isolates presentation concerns from raw domain entity models and prevents styling divergence.

## Problem Statement

Inconsistent badge styling definitions and decentralized status token mappings across session presentation components and export formatters lead to visual fragmentation, duplicate style declarations, and maintenance overhead when badge variants change.

## Decision

1. MUST: Export utilities rendering badge representations MUST coordinate badge formatting with the `@/lib/session/badge-styles` module to maintain visual and textual parity with presentation components.

## Policy Block

- MUST Export utilities rendering badge representations MUST coordinate badge formatting with the `@/lib/session/badge-styles` module to maintain visual and textual parity with presentation components.

In scope:
- Session presentation components, table shells, card items, and row components rendering status indicators
- Export formatting utilities generating badge representations from session data
- Workspace dashboard views displaying session metadata badges

Out of scope:
- Domain components outside the session boundary that do not display session status or metadata
- Low-level primitive styling tokens unassociated with session domain badge states

Exceptions:
- EXC-20-001: A specialized export format cannot map to standard badge style tokens and requires plain text status normalization

## Rationale

- Centralizing badge styles in `@/lib/session/badge-styles` enforces a single source of truth for session status indicators across both client components and export utilities.
- Decoupling badge style tokens from view components enables independent evolution of presentation themes while preserving data model contracts.
- Consuming badge styles alongside session view-models establishes a cohesive domain presentation layer that standardizes badge rendering across table and card layouts.

## Consequences

Positive:
- Enforces consistent visual appearance and token mapping for session badges across all dashboard and session views.
- Reduces code duplication by eliminating redundant class strings and style definitions in individual components.
- Simplifies maintenance by centralizing badge variant modifications within a single module.

Negative:
- Introduces a module coupling where changes to badge style contracts require updates across consuming presentation components.
- Restricts component-level customization of badge styles, requiring new variants to be formally defined in the centralized module.

## Alternatives

- Inline badge styling within each individual component (rejected)
  Rejected because: Causes visual inconsistency, duplicate style definitions across components, and high maintenance overhead when styles change
  When valid: Prototyping isolated one-off components before integration into the session domain
- Global generic design system badge primitives without domain-specific session token mapping (rejected)
  Rejected because: Fails to encapsulate session-specific state and status mapping, forcing components to repeatedly re-derive badge variants
  When valid: Generic application-wide badges with no session domain semantics

## Risks

- Centralized badge module becoming bloated with one-off component styling overrides
  Mitigation: Establish strict review gates to ensure only shared domain badge states and variants are added to the module
  Owner: Engineering Team
- Export formatters falling out of sync with presentation component badge tokens
  Mitigation: Enforce automated unit tests validating export formatter alignment with badge style definitions
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
- Define all session badge color variants, border treatments, and sizing tokens within the centralized badge style module as exported constants or functions.
- Pair badge style consumption with session view-models to ensure badges reflect normalized session state rather than raw payload properties.

## Continuation Context


Verify commands:
- Inspect the project configuration to discover the static analysis script and execute it to verify imports of the badge styling module across session components.
- Discover the repository test runner from the project scripts and execute the component test suite to confirm badge rendering conformity.
- Run the project type validation script discovered from repository configuration to ensure type safety of imported badge style tokens.

Accept when:
- Static analysis confirms all session badge rendering components import styling exclusively from the centralized badge style module without undeclared styling duplicates.
- All unit and component tests verifying session badge rendering pass without errors.
- Type checking passes with zero diagnostics across all modules consuming badge styling definitions.

## Enforcement

- Verified by: Automated continuous integration checks executing static analysis and type validation on pull requests.
- Verified by: Peer code review verifying adherence to centralized badge styling import rules for all session area changes.
- Violation handling: Pull requests introducing inline badge styles or bypassing the centralized module will fail automated checks and require refactoring before merge approval.
- Exception process: Exceptions must be submitted via architectural review request documenting the rationale and approved by the session domain lead.