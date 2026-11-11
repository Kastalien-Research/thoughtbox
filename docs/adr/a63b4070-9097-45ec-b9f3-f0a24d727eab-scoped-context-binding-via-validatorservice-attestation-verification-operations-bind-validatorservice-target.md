---
version: 2
name: a63b4070-9097-45ec-b9f3-f0a24d727eab-scoped-context-binding-via-validatorservice-attestation-verification-operations-bind-validatorservice-target
description: "Scoped Context Binding via validatorService: Attestation Verification Operations Bind Validatorservice Target"
metadata:
  actual:
    adr_id: a63b4070-9097-45ec-b9f3-f0a24d727eab
    status: accepted
    candidate_group_id: 90718bdd-4d90-4a6f-8fa4-b50f5c5bc670
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/merge-evidence/**
      - src/notebook/**
      - src/protocol/**
---

# Scoped Context Binding via validatorService: Attestation Verification Operations Bind Validatorservice Target

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/merge-evidence/**`
- `src/notebook/**`
- `src/protocol/**`

## Context

- Attestation and claim validation require deterministic execution context scoped to the target evaluation entity.
- Unscoped or globally instantiated validation providers risk ambient state pollution and identity ambiguity during concurrent evaluation branches.
- Protocol verification workflows require explicit attribution of primary and recovery validation providers to specific cell identities.

## Problem Statement

Without explicit contextual scoping, validation provider instances risk cross-contaminating state or executing evaluations against mismatched target cells, leading to untrusted audit trails and ambiguous verification outcomes during protocol checkpoints.

## Decision

1. MUST: All attestation and verification operations MUST bind the validatorService to the target notebook and cell identifiers before performing any evaluation or claim verification.

## Policy Block

- MUST All attestation and verification operations MUST bind the validatorService to the target notebook and cell identifiers before performing any evaluation or claim verification.

In scope:
- Evaluation workflows executing cell attestation, claim generation, or checkpoint validation across protocol handlers.
- Merge evidence generators reconciling claims across divergent branches.

Out of scope:
- Stateless utility functions operating exclusively on primitive data structures without entity context.
- Static configuration loading prior to runtime initialization.

## Rationale

- Binding validatorService to discrete coordinate pairs isolates provider state to the active execution cell and prevents cross-branch contamination.
- Explicit provider binding enables protocol orchestration handlers to cleanly differentiate between primary and recovery verification paths.
- Enforcing pre-bound provider instances creates audit records where verification results are immutably tied to the exact source context.

## Consequences

Positive:
- Guarantees evaluation isolation across concurrent evaluation branches and recovery paths.
- Eliminates redundant parameter passing across intermediate verification helper functions.
- Establishes deterministic attribution of validation results to specific source entities.

Negative:
- Requires instantiation overhead for bound provider references across deeply nested evaluation flows.
- Increases memory footprint when maintaining cached references to multiple bound provider instances.

## Alternatives

- Pass notebook and cell identifiers as arguments to every individual validator method call. (rejected)
  Rejected because: Increases parameter drilling, introduces human error in parameter propagation, and allows inconsistent context between consecutive calls.
  When valid: Valid only in purely stateless utility functions with single-method invocations.
- Store current target identity in ambient thread-local or global execution context. (rejected)
  Rejected because: Fails in asynchronous concurrent workflows where multiple cells or branches are evaluated simultaneously.
  When valid: Valid only in single-threaded, strictly synchronous execution pipelines.

## Risks

- Stale bound provider references retained across lifecycle updates to the underlying notebook state.
  Mitigation: Evict and re-bind provider instances whenever target notebook structure or cell content mutates.
  Owner: engineering team
- Failure to verify lockfile version leading to subtle API discrepancies in supporting runtime libraries.
  Mitigation: Enforce lockfile verification and automated contract testing in the verification pipeline.
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
- Derive bound validator instances at the entry point of protocol handling routines and propagate the bound instance through the evaluation lifecycle.
- Ensure factory methods producing validatorService bindings validate the presence of both notebook and cell identifiers before returning the bound instance.

## Continuation Context


Verify commands:
- Discover the project verification script from the repository manifest and execute test suites covering protocol handlers and validator bindings.
- Inspect the lock resolution artifact using repository tooling to confirm all dependency versions match expected definitions.
- Run static analysis checks defined in repository configuration to ensure no unbound validator service calls exist.

Accept when:
- All protocol and notebook validator test suites pass without unbound provider invocation warnings.
- All attestation records in evidence generation contain valid bound context coordinates.

## Enforcement

- Verified by: Automated test suites executed during continuous integration validating provider binding behavior.
- Verified by: Static type checking and architectural linters enforcing binding method calls prior to provider execution.
- Verified by: Peer code review verifying adherence to scoped binding requirements across protocol handlers.
- Violation handling: Pull requests containing unbound validator service invocations are blocked from merging.
- Violation handling: Runtime invocations of unbound validation routines throw descriptive scoping exceptions immediately.
- Exception process: Exceptions require documented architectural justification and formal sign-off from the technical lead.
- Exception process: Approved exceptions must be tracked with temporary waivers containing expiration criteria.