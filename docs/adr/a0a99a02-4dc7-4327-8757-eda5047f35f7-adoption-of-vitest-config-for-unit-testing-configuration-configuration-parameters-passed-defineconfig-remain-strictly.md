---
version: 2
name: a0a99a02-4dc7-4327-8757-eda5047f35f7-adoption-of-vitest-config-for-unit-testing-configuration-configuration-parameters-passed-defineconfig-remain-strictly
description: "Adoption of vitest/config for Unit Testing Configuration: Configuration Parameters Passed Defineconfig Remain Strictly"
metadata:
  actual:
    adr_id: a0a99a02-4dc7-4327-8757-eda5047f35f7
    status: accepted
    candidate_group_id: 0bd669a3-2978-4669-9c27-9d82b742b3e2
    evidence:
      source: deep
  scope:
    root: apps/web
---

# Adoption of vitest/config for Unit Testing Configuration: Configuration Parameters Passed Defineconfig Remain Strictly

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `**` (whole root)

## Context

- The web application workspace requires a standardized configuration mechanism to govern unit test execution
- The codebase establishes test runner setup by importing defineConfig from vitest/config
- Path resolution utilities from the path module are used to resolve workspace directories and module mappings for the test runner

## Problem Statement

Inconsistent or fragmented test configurations across application packages lead to divergent execution environments, non-uniform module resolution, and unreliable test results. A centralized and typed configuration pattern is required to standardize unit testing behavior across the workspace.

## Decision

1. SHOULD: Configuration parameters passed to defineConfig SHOULD remain strictly typed and limited to unit testing concerns.

## Policy Block

- SHOULD Configuration parameters passed to defineConfig SHOULD remain strictly typed and limited to unit testing concerns.

In scope:
- Unit test runner configuration and environment definitions within the web application workspace
- Module path resolution and alias mapping defined for unit test execution

Out of scope:
- End-to-end browser automation suites managed outside unit test runner scope
- Application production bundle and build tool configurations

## Rationale

- Adopting defineConfig from vitest/config provides typed configuration validation and autocompletion for test runner settings
- Integrating the path module provides reliable cross-platform resolution for test directories and alias mappings
- Standardizing on a single test configuration helper prevents configuration fragmentation and simplifies test environment maintenance

## Consequences

Positive:
- Unified and typed configuration contract for all unit test execution in the workspace
- Reliable path resolution across different operating environments via standard path helpers
- Simplified maintenance through a single configuration entry point for unit testing

Negative:
- Coupling of test execution settings to the vitest/config API schema
- Test configuration upgrades require validation against resolved dependency lockfiles to avoid schema incompatibilities

## Alternatives

- Authoring untyped test configuration objects without defineConfig (rejected)
  Rejected because: Eliminates compile-time validation and autocompletion of test runner options, increasing the likelihood of silent misconfigurations
  When valid: When running in minimal environments where TypeScript definitions and configuration helpers cannot be imported
- Maintaining separate custom compiler transform scripts for test execution (rejected)
  Rejected because: Introduces configuration duplication and increased maintenance overhead compared to native runner configuration
  When valid: When integrating with legacy runtimes requiring specialized transformation pipelines not supported by the primary runner

## Risks

- Breaking schema changes in newer releases of vitest/config affecting test execution
  Mitigation: Enforce lockfile grounding before modifying test configurations and consult version-specific documentation
  Owner: Engineering Team
- Inaccurate path mappings causing test suites to import incorrect module mocks or runtime dependencies
  Mitigation: Validate path resolution in continuous integration and ensure path mappings mirror application workspace resolution
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
- Locate the unit test configuration module within the application workspace and ensure defineConfig is invoked as the default export
- Use path module functions to resolve workspace-relative paths for test setup and directory inclusion

## Continuation Context


Verify commands:
- Discover the unit test script declared in the project dependency manifest and execute it via the workspace runner
- Verify that the test configuration imports defineConfig from vitest/config and parses without schema errors

Accept when:
- The project unit test suite executes successfully with zero failures
- The test configuration passes validation during test runner initialization without errors or deprecation warnings

## Enforcement

- Verified by: Continuous integration test execution workflows verifying all unit tests pass
- Verified by: Code review verifying that test configuration files use defineConfig from vitest/config
- Violation handling: Merge requests introducing untyped or incompatible test configurations are blocked until compliance is achieved
- Exception process: Exceptions must be documented through an architectural review with justification for alternative test runner configurations