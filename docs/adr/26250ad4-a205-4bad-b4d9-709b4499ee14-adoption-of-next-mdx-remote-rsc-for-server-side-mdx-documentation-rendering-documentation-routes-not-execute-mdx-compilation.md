---
version: 2
name: 26250ad4-a205-4bad-b4d9-709b4499ee14-adoption-of-next-mdx-remote-rsc-for-server-side-mdx-documentation-rendering-documentation-routes-not-execute-mdx-compilation
description: "Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Routes Not Execute Mdx Compilation"
metadata:
  actual:
    adr_id: 26250ad4-a205-4bad-b4d9-709b4499ee14
    status: accepted
    candidate_group_id: a7733d88-b94a-4337-8387-0592b66cba74
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/**
---

# Adoption of next-mdx-remote/rsc for Server-Side MDX Documentation Rendering: Documentation Routes Not Execute Mdx Compilation

Status: proposed
Date: 2025-02-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/**`

## Context

- Documentation routes require rich content formatting, dynamic component embedding, and consistent styling across multiple information pages.
- Multiple documentation entry points consistently import next-mdx-remote/rsc alongside shared document loading, component mapping, and layout modules.
- Centralizing content processing within React Server Components minimizes client-side bundle size by executing markdown compilation exclusively on the server.

## Problem Statement

Rendering rich documentation with interactive custom components across multiple routes risks inconsistent rendering behavior, duplicated markdown loading logic, and excessive client-side bundle bloat if markdown compilers are shipped to the client browser.

## Decision

1. MUST_NOT: Documentation routes MUST NOT execute MDX compilation inside client component boundaries or import client-side markdown compiler runtimes into client bundles.

## Policy Block

- MUST_NOT Documentation routes MUST NOT execute MDX compilation inside client component boundaries or import client-side markdown compiler runtimes into client bundles.

In scope:
- Route pages and views responsible for rendering documentation content within the web application
- Server component render trees consuming markdown and MDX documents

Out of scope:
- Standard non-documentation application pages with static or database-driven UI layouts
- Pure client components that receive pre-rendered markup or standard React children

## Rationale

- Adopting next-mdx-remote/rsc enables MDX parsing directly inside React Server Components, eliminating the need to transmit markdown compilers or parser runtimes to the browser.
- Coupling next-mdx-remote/rsc with shared loader and component mapping modules enforces uniform typography, code block syntax highlighting, and layout hierarchy across documentation routes.
- Empirical evidence across all observed documentation route pages confirms consistent integration of next-mdx-remote/rsc, establishing a standard content rendering architecture.

## Consequences

Positive:
- Minimizes client bundle size by isolating markdown compilation and parsing runtimes to the server.
- Enforces consistent typography, code presentation, and design system elements across documentation routes via centralized component mappings.
- Simplifies documentation route authoring by encapsulating content retrieval and layout composition into reusable modules.

Negative:
- Server-side rendering latency increases slightly during on-demand compilation of complex MDX documents unless cached.
- Interactive client components inside MDX must be explicitly bridged through the shared component mapping module.

## Alternatives

- Client-side MDX rendering using standard client-only compiler packages (rejected)
  Rejected because: Transmitting compiler libraries to the browser significantly inflates client bundle size and degrades initial page load performance.
  When valid: Applications where markdown content is authored dynamically by end users in the browser and requires real-time preview rendering.
- Build-time static compilation of MDX files into discrete page modules using bundler plugins (rejected)
  Rejected because: Couples document structure to bundler build cycles, reducing flexibility for dynamic or decoupled document retrieval.
  When valid: Small static websites where content changes strictly correspond to code deployment cycles.

## Risks

- Breaking API changes between versions of next-mdx-remote/rsc altering server component compilation behavior
  Mitigation: Strict adherence to lock-version grounding by verifying resolved library versions against official documentation prior to upgrading.
  Owner: engineering team
- Custom component mismatches or missing element overrides leading to unstyled or broken interactive elements in documentation
  Mitigation: Centralize all supported elements in the shared component mapping module and validate them with automated integration tests.
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
- Invoke next-mdx-remote/rsc within server component route handlers, passing raw document source obtained from the centralized document loader.
- Register custom components, code block highlighters, and container elements within the shared component mapping module to ensure design system compliance.

## Continuation Context


Verify commands:
- Discover and execute the project static type checker and linter scripts from the repository manifest to verify route module imports and type correctness.
- Discover and run the project build script to ensure server component compilation of MDX content completes without errors.
- Discover and run the project test suite to validate documentation route rendering and component mapping output.

Accept when:
- All documentation route pages render MDX content without runtime or build-time compilation errors.
- No client-side MDX compiler libraries are included in client bundles for documentation routes.
- Shared component mappings and layout components wrap all documentation content consistently.

## Enforcement

- Verified by: Automated continuous integration pipeline executing repository build, lint, and test scripts
- Verified by: Peer code reviews verifying adherence to shared document loader and component mapping modules
- Violation handling: Continuous integration build failures on unauthorized client-side compiler imports or broken route typings
- Violation handling: Pull request rejection until route pages adopt next-mdx-remote/rsc and shared documentation modules
- Exception process: Architectural review and documentation of explicit exceptions for specialized interactive documentation pages requiring client-side compilation