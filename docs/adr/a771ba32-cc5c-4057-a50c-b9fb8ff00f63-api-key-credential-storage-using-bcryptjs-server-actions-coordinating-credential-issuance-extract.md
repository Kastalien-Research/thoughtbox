---
version: 2
name: a771ba32-cc5c-4057-a50c-b9fb8ff00f63-api-key-credential-storage-using-bcryptjs-server-actions-coordinating-credential-issuance-extract
description: "API Key Credential Storage Using bcryptjs: Server Actions Coordinating Credential Issuance Extract"
metadata:
  actual:
    adr_id: a771ba32-cc5c-4057-a50c-b9fb8ff00f63
    status: accepted
    candidate_group_id: b38bd68f-3c56-4a4b-ae5e-f16262c601e3
    evidence:
      source: deep
  scope:
    root: apps/web
    paths:
      - src/app/w/**
---

# API Key Credential Storage Using bcryptjs: Server Actions Coordinating Credential Issuance Extract

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `apps/web`

Applies to:
- `src/app/w/**`

## Context

- Workspace API keys grant programmatic access to tenant resources and represent sensitive authentication secrets.
- Direct storage of plain credential strings creates severe security vulnerabilities if the underlying database is accessed or leaked.
- The application implements server action boundaries to handle API key creation and revocation workflows.
- The codebase adopts bcryptjs to provide adaptive one-way cryptographic hashing for credential storage.

## Problem Statement

Storing raw or reversibly encrypted API credentials exposes tenant systems to credential compromise in the event of database exfiltration. The system requires a secure, non-reversible credential storage mechanism that imposes computational cost on brute-force attempts while integrating cleanly with server-side action workflows.

## Decision

1. SHOULD: Server actions coordinating credential issuance SHOULD extract input fields via formData.get and coordinate cache invalidation through next/cache only after successful credential persistence.

## Policy Block

- SHOULD Server actions coordinating credential issuance SHOULD extract input fields via formData.get and coordinate cache invalidation through next/cache only after successful credential persistence.

In scope:
- Server action handlers creating or updating workspace API keys and credential records.
- Server-side routines persisting secret credential tokens.

Out of scope:
- Client-side components and presentation layers.
- Non-secret metadata operations such as credential name or workspace slug updates.

## Rationale

- The bcryptjs library provides an established, adaptive hashing implementation that enables configurable work factors to mitigate offline dictionary attacks.
- Invoking bcrypt.hash with a cost factor of 12 provides a robust balance between cryptographic resistance against brute-force attacks and server execution latency during key generation.
- Executing hashing asynchronously within server actions prevents thread-pool starvation while ensuring plaintext keys exist only ephemerally in memory before delivery to the user.

## Consequences

Positive:
- Eliminates plaintext credential persistence across the database and persistence tiers.
- Enforces computational resistance against offline cracking attempts through a work factor of 12.
- Encapsulates credential hashing inside dedicated server action workflows.

Negative:
- Increases CPU utilization and processing latency during API key creation.
- Prevents recovery of original key values, requiring complete key re-issuance upon loss.

## Alternatives

- Reversible symmetric encryption for stored API keys (rejected)
  Rejected because: Reversible encryption introduces centralized key management vulnerabilities and allows complete credential exposure if encryption keys are compromised.
  When valid: When the original secret string must be retrieved by the system to authenticate against external third-party services.
- Fast cryptographic digest algorithms without adaptive work factors (rejected)
  Rejected because: Fast cryptographic digests lack adaptive cost factors and are highly susceptible to high-speed hardware brute-force and rainbow table attacks.
  When valid: When verifying integrity of non-secret content or large binary payloads where collision resistance alone is sufficient.

## Risks

- Excessive CPU overhead during concurrent credential generation requests.
  Mitigation: Apply rate limiting on credential creation server actions and maintain asynchronous execution.
  Owner: engineering team
- Inadvertent exposure of plain key material in logging or error tracking services prior to hashing.
  Mitigation: Ensure plain key variables are scoped strictly within the action handler and omitted from error objects and cache updates.
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
- Extract form parameters via the form data interface and coordinate key generation utilities before hashing.
- Trigger cache invalidation through the cache layer only after persistence operations complete successfully.

## Continuation Context


Verify commands:
- Discover and execute the project test runner to validate that credential hashing tests pass.
- Discover and execute the static analysis linter to confirm compliance with asynchronous hashing rules.

Accept when:
- All unit and integration tests for credential generation and hashing pass without failure.
- Static analysis checks verify that bcrypt.hash is invoked asynchronously with cost factor 12 and no plaintext keys are logged.

## Enforcement

- Verified by: Automated continuous integration test suites and static analysis checks.
- Verified by: Peer code review for all pull requests modifying server action handlers or credential storage.
- Violation handling: Build pipeline failure on failing test suites or unapproved credential persistence patterns.
- Violation handling: Mandatory pull request rejection until credential storage complies with hashing rules.
- Exception process: Formal security architecture review and signed approval documented in the architecture exception log.