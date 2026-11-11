---
version: 2
name: 313117fb-fdc3-4715-bc38-642214692786-adoption-of-vitest-config-defineconfig-for-unit-test-configuration-test-configurations-provide-configuration-objects-through
description: "Adoption of vitest/config defineConfig for Unit Test Configuration: Test Configurations Provide Configuration Objects Through"
metadata:
  actual:
    adr_id: 313117fb-fdc3-4715-bc38-642214692786
    status: accepted
    candidate_group_id: 25d23f8c-14ac-45ec-9e97-bcfbb4939453
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - "**"
      - "!apps/web/**"
      - "!infra/gcp/**"
      - "!plugins/thoughtbox-claude-code/**"
      - "!supabase/**"
---

# Adoption of vitest/config defineConfig for Unit Test Configuration: Test Configurations Provide Configuration Objects Through

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `**` (whole repository)

Excludes:
- `apps/web/**`
- `infra/gcp/**`
- `plugins/thoughtbox-claude-code/**`
- `supabase/**`

## Context

- The project requires a consistent and maintainable mechanism for defining unit testing execution options and environments.
- Unit testing infrastructure relies on vitest/config to provide configuration schema declarations and test runner options.
- Centralizing unit test configuration through a standardized module prevents divergent test runner options across modules.

## Problem Statement

Without a standardized configuration structure, unit test executions risk inconsistency across test suites and unvalidated configuration schemas. Using vitest/config with defineConfig ensures uniform configuration structure and typed verification of test runner parameters.

## Decision

1. MUST: Test configurations MUST provide configuration objects through the defineConfig function helper rather than exporting unvalidated raw configuration objects.

## Policy Block

- MUST Test configurations MUST provide configuration objects through the defineConfig function helper rather than exporting unvalidated raw configuration objects.

In scope:
- Unit test suite configuration modules and test harness setup definitions.
- Test runner parameter declarations across the repository.

Out of scope:
- Application runtime configuration unrelated to unit testing.
- Static asset and documentation configuration.

## Rationale

- Adopting defineConfig from vitest/config ensures that test configurations adhere to expected schema definitions and support static validation.
- Consolidating test runner parameters within a dedicated configuration definition prevents fragmented test harness behavior across test executions.
- Utilizing a dedicated configuration helper facilitates future upgrades and ensures alignment with the adopted test runner ecosystem.

## Consequences

Positive:
- Establishes a centralized and uniform specification for unit test runner behavior across the codebase.
- Enables static type safety and schema validation for test runner execution options via defineConfig.
- Minimizes discrepancies between local developer test runs and automated continuous integration pipelines.

Negative:
- Couples testing infrastructure to the configuration API exposed by vitest/config.
- Requires maintenance across dependency version updates to ensure schema compatibility.

## Alternatives

- Plain unvalidated object exports for test configuration (rejected)
  Rejected because: Lacks static type validation and schema verification for test runner parameters, increasing the likelihood of runtime configuration errors.
  When valid: Only viable in minimal environments where the test execution harness does not provide typed helper utilities.
- Ad-hoc command-line execution parameters without centralized configuration (rejected)
  Rejected because: Scatters test execution arguments across multiple execution scripts, resulting in inconsistent test environments.
  When valid: Useful only for transient troubleshooting of an isolated test file.

## Risks

- Breaking API changes across version upgrades in the configuration module.
  Mitigation: Adhere to the lock-version grounding policy and review module documentation prior to upgrading test configuration dependencies.
  Owner: engineering team
- Misconfiguration of test runner parameters leading to bypassed or skipped test files.
  Mitigation: Validate test runner discovery and execution outputs in automated build pipelines.
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
- Ensure all test configuration exports utilize defineConfig from vitest/config to maintain typed configuration contracts across the project.

## Continuation Context


Verify commands:
- grep -rn "from 'vitest/config'" .
- grep -rn "defineConfig" .

Accept when:
- The test configuration module imports and utilizes defineConfig from vitest/config.
- The project test suite executes successfully using the configured test definitions.

## Enforcement

- Verified by: Automated continuous integration pipeline executing unit tests.
- Verified by: Peer code review verifying adherence to test configuration standards.
- Violation handling: Pull requests bypassing the standardized configuration will fail automated verification and be blocked from merge.
- Exception process: Exceptions require review and approval by engineering leads with documented rationale.