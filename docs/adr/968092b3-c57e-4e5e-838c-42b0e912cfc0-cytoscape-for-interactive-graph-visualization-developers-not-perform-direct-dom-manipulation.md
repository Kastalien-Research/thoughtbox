---
version: 2
name: 968092b3-c57e-4e5e-838c-42b0e912cfc0-cytoscape-for-interactive-graph-visualization-developers-not-perform-direct-dom-manipulation
description: "Cytoscape for Interactive Graph Visualization: Developers Not Perform Direct Dom Manipulation"
metadata:
  actual:
    adr_id: 968092b3-c57e-4e5e-838c-42b0e912cfc0
    status: accepted
    candidate_group_id: 2b47da57-6088-4e52-9c0d-d4349e40c671
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# Cytoscape for Interactive Graph Visualization: Developers Not Perform Direct Dom Manipulation

Status: proposed
Date: 2025-05-15
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`

## Context

- The application requires interactive visual representations of relational knowledge structures and network topologies within client user interface views.
- Graph presentation requires complex force-directed layout computation, customizable node and edge styling, and responsive event handling for user navigation and selection.
- Decoupled architecture is necessary to separate raw relational data queries from graph element formatting and presentation styles.

## Problem Statement

Interactive network visualizations require specialized layout calculations, efficient rendering for interconnected nodes and edges, and robust event delegation. Implementing custom graph rendering logic from scratch creates high maintenance overhead, inconsistent styling, and potential performance bottlenecks. A standardized, modular graph visualization architecture is required to decouple data transformation, styling, and client-side lifecycle management.

## Decision

1. MUST_NOT: Developers MUST_NOT perform direct DOM manipulation or canvas mutations outside of the Cytoscape instance management APIs.

## Policy Block

- MUST_NOT Developers MUST_NOT perform direct DOM manipulation or canvas mutations outside of the Cytoscape instance management APIs.

In scope:
- Interactive network graph rendering within client user interface modules
- Data structures requiring relational node and edge topology visualization
- Client-side graph layout computation and event delegation

Out of scope:
- Static non-interactive diagrams or simple tabular data presentation
- Server-side rendering pipelines where DOM and canvas primitives are unavailable
- Standard non-relational chart types such as bar charts or line graphs

Exceptions:
- EXC-20-001: A headless computation module requires pre-calculating graph layouts without rendering interactive viewports

## Rationale

- Cytoscape provides a battle-tested, high-performance graph theory and visualization engine capable of rendering complex relational graphs with specialized layout algorithms such as fcose.
- Decoupling element transformation, stylesheet definitions, and layout middleware from the UI component tree ensures maintainable, testable code and prevents performance regressions during graph updates.
- Encapsulating event delegation through the graph instance API preserves declarative component boundaries while providing low-latency interaction handling for nodes and background taps.

## Consequences

Positive:
- Standardizes relational graph rendering and interaction patterns across user interface components.
- Separates data normalization, visual styling, and layout orchestration into modular, unit-testable units.
- Enables complex force-directed and compound node layouts through registered Cytoscape plugins without custom geometry calculations.

Negative:
- Increases client-side bundle size due to the Cytoscape runtime and layout engine dependencies.
- Requires strict lifecycle management in client components to prevent memory leaks from uncleaned event subscriptions and retained canvas contexts.

## Alternatives

- Custom Canvas or SVG rendering (rejected)
  Rejected because: Reimplementing force-directed layout computation, collision avoidance, and viewport navigation creates substantial maintenance overhead and duplicates established graph algorithms.
  When valid: When displaying static, non-interactive topologies with trivial node counts where third-party libraries cannot be accommodated.
- Generic non-relational charting libraries (rejected)
  Rejected because: Standard charting modules lack native graph theory data models, compound node layout engines, and graph-specific event delegation models.
  When valid: When visual representations are limited to hierarchical trees, bar graphs, or standard coordinate-based statistical visualizations.

## Risks

- Memory retention and event listener leaks caused by unmanaged graph instance lifecycles during client component unmounting.
  Mitigation: Enforce explicit instance disposal and listener cleanup inside component teardown routines.
  Owner: Frontend Engineering
- Client thread saturation and frame drops when rendering graphs with high node and edge cardinality.
  Mitigation: Incorporate element filtering, layout stabilization limits, and incremental data streaming within adapter layers.
  Owner: Frontend Engineering

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Register all external layout extensions and middleware plugins with the core Cytoscape library prior to mounting graph viewports.
- Implement element transformation utilities as pure functions that convert domain entities to Cytoscape element descriptors without introducing component state dependencies.
- Organize graph visual styling as declarative selector-property definitions in dedicated configuration modules to maintain clean separation from runtime layout parameters.

## Continuation Context


Verify commands:
- Discover and execute the project static analysis and type checking suite to verify Cytoscape interface contracts and type definitions across graph modules.
- Discover and execute unit testing routines for element transformation adapters to verify correct mapping of domain entities into graph node and edge objects.
- Discover and execute component integration test suites to validate client-side graph initialization, event delegation, and unmount lifecycle cleanup.

Accept when:
- All graph data transformation adapters pass automated unit tests validating expected Cytoscape node and edge structures.
- Graph UI components successfully initialize the Cytoscape runtime with configured layouts and release all instance resources upon unmounting.
- The project static analysis and type checking suites complete with zero errors across all graph-related modules.

## Enforcement

- Verified by: Automated continuous integration checks executing repository type checking and unit test suites.
- Verified by: Peer code review verifying separation of concerns between element adapters, styling declarations, and component lifecycle event bindings.
- Violation handling: Pull requests containing inline graph data formatting or unregistered layout extensions will be blocked during code review until restructured.
- Violation handling: Direct DOM manipulation or missing unmount cleanup within graph components must be rectified prior to merging.
- Exception process: Submit an architectural review request outlining technical constraints that prevent Cytoscape adoption, requiring sign-off from the technical lead.