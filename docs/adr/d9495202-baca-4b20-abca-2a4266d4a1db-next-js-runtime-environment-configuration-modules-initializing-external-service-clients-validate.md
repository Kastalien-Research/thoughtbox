---
version: 2
name: d9495202-baca-4b20-abca-2a4266d4a1db-next-js-runtime-environment-configuration-modules-initializing-external-service-clients-validate
description: "Next.js Runtime Environment Configuration: Modules Initializing External Service Clients Validate"
metadata:
  actual:
    adr_id: d9495202-baca-4b20-abca-2a4266d4a1db
    status: accepted
    candidate_group_id: 2439c5f1-c378-48fb-9cc3-e922cefe0844
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - .claude/hooks/**
      - middleware.ts
      - src/app/**
      - src/lib/**
---

# Next.js Runtime Environment Configuration: Modules Initializing External Service Clients Validate

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `.claude/hooks/**`
- `middleware.ts`
- `src/app/**`
- `src/lib/**`

## Context

- The web application interacts with external services, databases, and authentication providers across heterogeneous execution environments including client browsers, serverless route handlers, and edge middleware.
- Application modules require access to environment-specific endpoints, public identifiers, and sensitive administrative credentials to establish service clients and authenticate requests.
- Next.js distinguishes between client-bundled configuration and server-only runtime secrets through variable naming conventions and execution boundaries.

## Problem Statement

Managing runtime configuration and credentials across hybrid client and server execution environments risks exposing sensitive server secrets in browser bundles or encountering unhandled runtime failures when required configuration is missing during service initialization.

## Decision

1. MUST: Modules initializing external service clients MUST validate the presence of required runtime environment variables during execution and handle unconfigured states gracefully.

## Policy Block

- MUST Modules initializing external service clients MUST validate the presence of required runtime environment variables during execution and handle unconfigured states gracefully.

In scope:
- All runtime configuration and credential retrieval across client components, server components, middleware, and route handlers.

Out of scope:
- Static compile-time constant definitions that do not vary across deployment environments.

Exceptions:
- EXC-37-001: Local development scripts or migration utilities running outside framework execution context requiring direct environment loading

## Rationale

- Direct runtime environment variable resolution using framework-level public prefix conventions ensures clear boundary separation between browser-safe parameters and privileged server secrets.
- Consistently reading configuration from runtime sources enables multi-environment deployments across local, preview, and production stages without rebuilding static assets.
- Co-locating environment resolution with service client initialization maintains modularity across distinct application domains such as authentication, payment webhooks, and database access.

## Consequences

Positive:
- Prevents sensitive service credentials from leaking into client-side JavaScript bundles.
- Enables dynamic configuration adjustments across deployment environments without recompilation.
- Establishes clear visibility into external service dependencies per execution boundary.

Negative:
- Spreads environment variable references across multiple modules if not strictly abstracted into shared configuration utilities.
- Requires comprehensive environment variable provisioning across all deployment platforms to prevent runtime initialization exceptions.

## Alternatives

- Centralized runtime configuration service fetching secrets dynamically from external key-value stores at startup (rejected)
  Rejected because: Introduces external network latency and operational dependency at application boot compared to native runtime environment variable injection
  When valid: When operating in distributed microservice topologies requiring dynamic runtime secret rotation without application restarts
- Hardcoded configuration values embedded within application source code (rejected)
  Rejected because: Violates fundamental security boundaries and prevents environment-specific deployments
  When valid: When deploying static demo prototypes with no external services or sensitive credentials
- Unified client and server configuration object exposed unconditionally across all bundles (rejected)
  Rejected because: Risks leaking sensitive service keys and admin tokens to client browsers during client bundle compilation
  When valid: When building an exclusively server-rendered application with zero client bundle generation

## Risks

- Accidental prefixing of sensitive service secrets with the public variable prefix exposing credentials in client bundle distributions
  Mitigation: Enforce automated static analysis and linting checks in continuous integration to detect secret exposure in client bundles
  Owner: engineering team
- Missing runtime environment variables causing silent failures or runtime exceptions during critical requests
  Mitigation: Implement runtime validation assertions on external service initialization with explicit error logging
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
- Implement validation helpers to ensure required configuration values are non-empty upon initial client instantiation.
- Group related configuration variables within dedicated adapter modules to prevent scattered property access across UI components.

## Continuation Context


Verify commands:
- Discover and run the project test suite using the project build runner specified in repository manifests.
- Discover and run the project type checker and static analysis linters to confirm environment variable usage conforms to execution boundaries.

Accept when:
- Static analysis and type checking pass without referencing server-only environment variables in client-side compilation units.
- All runtime execution paths successfully resolve required environment configuration values without runtime errors.
- Secret credentials remain restricted to server runtime contexts.

## Enforcement

- Verified by: Automated continuous integration build checks validating environment boundary isolation.
- Verified by: Static code analysis scanning for unauthorized process environment access in client bundles.
- Verified by: Peer code review during pull request evaluations.
- Violation handling: Continuous integration pipeline blocks pull requests that expose server-only credentials to client components.
- Violation handling: Violations must be refactored to conform to boundary conventions prior to branch merging.
- Exception process: Developers must submit an architecture exception request with documented risk assessment for review by the security and engineering leads.