---
version: 2
name: c5d12e7f-a6f6-40bd-9b67-877d5e42f9d5-adoption-of-the-lib-session-view-models-module-for-unified-session-presentation-modeling-user-interface-components-formatting-utilities-exploration
description: "Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: User Interface Components Formatting Utilities Exploration"
metadata:
  actual:
    adr_id: c5d12e7f-a6f6-40bd-9b67-877d5e42f9d5
    status: accepted
    candidate_group_id: 2db4b97d-6534-4d0f-80ab-e590c47bfabd
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
      - src/components/**
      - src/lib/session/**
---

# Adoption of the @/lib/session/view-models Module for Unified Session Presentation Modeling: User Interface Components Formatting Utilities Exploration

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`
- `src/components/**`
- `src/lib/session/**`

## Context

- Multiple session domain modules, exploration views, summary cards, and export utilities require structured representations of session lifecycle data.
- Direct coupling of user interface components to heterogeneous upstream telemetry and data storage structures introduces presentation fragmentation and duplication of parsing logic.
- The codebase establishes the internal module @/lib/session/view-models across session display and analysis features to isolate presentation schemas from raw data sources.

## Problem Statement

Session monitoring, exploration interfaces, and export utilities require consistent domain-specific representations of session data across diverse client and server components. Without a centralized presentation modeling contract, components risk duplicating state transformations, leaking backend schema variations into view logic, and violating presentation layer boundaries.

## Decision

1. MUST: All user interface components, formatting utilities, and exploration views within the session domain MUST import presentation types and structures exclusively from the @/lib/session/view-models module rather than defining ad-hoc representations.

## Policy Block

- MUST All user interface components, formatting utilities, and exploration views within the session domain MUST import presentation types and structures exclusively from the @/lib/session/view-models module rather than defining ad-hoc representations.

In scope:
- Client and server components rendering session monitoring, trace inspection, and summary information.
- Utility modules performing session export formatting, phase detection, and presentation-level search indexing.

Out of scope:
- Low-level database access layers and background telemetry collection ingestion pipelines that operate outside session presentation contexts.
- General application utility modules devoid of session domain logic.

Exceptions:
- EX-20-001: A novel telemetry attribute or raw transport format is evaluated in isolation prior to schema formalization.

## Rationale

- Analysis across twenty-four session feature modules confirms consistent reliance on @/lib/session/view-models as the presentation layer contract.
- Isolating view models within a dedicated internal module shields interface components from upstream telemetry protocol modifications and schema shifts.
- Centralizing view model definitions ensures uniform formatting, filtering, and export capabilities across timeline, table, and trace inspector interfaces.

## Consequences

Positive:
- Establishes a single authoritative contract for session presentation attributes across table, card, timeline, and trace views.
- Reduces code duplication across search, export, and phase detection utilities by sharing normalized data structures.
- Simplifies client-side state management by decoupling component logic from persistence schemas.

Negative:
- Introduces an indirection layer that requires updating view-model transformations when backend telemetry schemas expand.
- Requires developers to maintain bidirectional synchronization between raw ingested payloads and presentation entities.

## Alternatives

- Direct consumption of raw telemetry and database schemas in UI components (rejected)
  Rejected because: Couples presentation components tightly to database schema definitions, causing regressions across views whenever persistence formats evolve.
  When valid: Small-scale prototypes or internal administrative scripts with minimal UI complexity.
- Decentralized component-level view model interfaces declared within each component file (rejected)
  Rejected because: Leads to fragmented definitions, duplicate transformation routines, and incompatible types across related views and export utilities.
  When valid: Isolated standalone components that share no data structures with neighboring views.

## Risks

- View models may accumulate extraneous presentation state, evolving into bloated data structures.
  Mitigation: Enforce strict separation between domain presentation contracts and ephemeral local component UI state during architectural reviews.
  Owner: Session Feature Engineering Team
- Breaking contract changes in the shared module could cause broad cascading failures across dependent components.
  Mitigation: Execute comprehensive automated unit and interface regression test suites before publishing changes to shared contracts.
  Owner: Session Feature Engineering Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Organize session view models to reflect domain invariants such as thoughts, trace entries, and lifecycle milestones rather than specific UI widget hierarchies.
- Ensure all formatting utilities and export helpers consume the view models as read-only contracts to prevent accidental state mutation.

## Continuation Context


Verify commands:
- Discover the workspace static analysis script and execute it to verify that session UI components import types from the canonical session view-model module.
- Discover and run the project type checking and contract validation script to ensure view-model interface conformity.

Accept when:
- All session exploration, timeline, table, and formatter modules resolve their presentation types from the canonical view-model module without type errors.
- No UI component directly imports or consumes raw database models or telemetry payload definitions within presentation views.

## Enforcement

- Verified by: Automated continuous integration checks validating type contracts and import boundary rules.
- Verified by: Peer code review verifying adherence to session view-model interfaces on all pull requests affecting the session domain.
- Violation handling: Pull requests introducing ad-hoc presentation models or direct raw data access in session components will be blocked until refactored.
- Violation handling: Violations identified during code inspection must be remediated before merging into target integration branches.
- Exception process: Submit an architectural exception request detailing the requirement for temporary direct access, subject to approval by the domain lead.