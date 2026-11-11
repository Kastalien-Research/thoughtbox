---
version: 2
name: 50b10df1-e53e-45a3-901d-1901a202ccff-adoption-of-the-broker-proxy-module-for-peer-notebook-mediation-dispatch-data-exchanged-across-broker-proxy
description: "Adoption of the broker-proxy Module for Peer Notebook Mediation: Dispatch Data Exchanged Across Broker Proxy"
metadata:
  actual:
    adr_id: 50b10df1-e53e-45a3-901d-1901a202ccff
    status: accepted
    candidate_group_id: 98235467-e9d2-476e-81fb-f5552d2809eb
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/peer-notebook/**
---

# Adoption of the broker-proxy Module for Peer Notebook Mediation: Dispatch Data Exchanged Across Broker Proxy

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/peer-notebook/**`

## Context

- Multiple peer notebook components require coordinated communication between execution runtimes, brokered services, and proxy targets.
- Direct point-to-point connections between runtime providers and target handlers risk tight coupling and fragmented request validation.
- The codebase establishes a centralized internal broker-proxy module that standardizes proxy target routing and broker mediation across the subsystem.

## Problem Statement

Distributing runtime execution across diverse proxy targets without a unified proxy mediation boundary leads to architectural divergence, duplicated request parsing, and untracked execution paths across peer notebook services.

## Decision

1. SHOULD: Dispatch data exchanged across the broker-proxy boundary SHOULD conform to normalized schema types and structured validation contracts.

## Policy Block

- SHOULD Dispatch data exchanged across the broker-proxy boundary SHOULD conform to normalized schema types and structured validation contracts.

In scope:
- Peer notebook runtime provider implementations
- Proxy target dispatch modules
- Broker communication and coordination services

Out of scope:
- Standalone utility functions without proxy or broker coordination
- Isolated schema validation helpers with no mediation responsibilities

## Rationale

- Establishing the broker-proxy module as the mandatory mediation layer isolates dispatch logic, ensuring uniform target resolution and message routing.
- Decoupling runtime providers from proxy target implementations allows independent evolution of execution environments and brokered tool manifests.
- Evidence across multiple modules demonstrates consistent reliance on the shared broker-proxy abstraction to manage dispatch workflows.

## Consequences

Positive:
- Centralized mediation and dispatch routing across peer notebook components.
- Decoupled runtime providers and target execution handlers.
- Uniform enforcement of schema validation and error propagation across proxy boundaries.

Negative:
- Additional indirection layer required for all proxied interactions across components.
- Modifications to the shared broker-proxy interface necessitate coordinated updates across dependent runtime and target modules.

## Alternatives

- Direct invocation of proxy target handlers from runtime providers without mediation (rejected)
  Rejected because: Direct coupling between runtime providers and targets prevents centralized routing, manifest validation, and consistent security boundaries.
  When valid: Monolithic single-process utilities where proxying and brokering layers are unnecessary.
- Decentralized event bus for peer notebook communication (rejected)
  Rejected because: Asynchronous publish-subscribe messaging adds unnecessary complexity for request-response proxy dispatch patterns.
  When valid: Broadcast-dominated architectures where target handlers operate without synchronous request contracts.

## Risks

- Interface churn within the broker-proxy module could break dependent runtime providers and proxy targets.
  Mitigation: Enforce strict semantic versioning or interface regression test suites on shared module boundaries.
  Owner: Engineering Team
- Performance overhead from proxy message parsing and dispatch mediation.
  Mitigation: Profile proxy target dispatch paths and benchmark mediation overhead during integration verification.
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
- Ensure that new proxy target implementations register their interfaces and dispatch contracts through the broker-proxy abstraction.
- Maintain shared data and message contracts in dedicated type definitions aligned with the broker-proxy module requirements.

## Continuation Context


Verify commands:
- Discover and run the project static analysis and linting scripts to verify that module imports adhere to broker-proxy boundary constraints.
- Discover and execute the repository unit and integration test suite to validate broker-proxy dispatch and mediation behavior.
- Discover and run the architecture boundary checker script to detect unauthorized direct dependencies between runtime providers and proxy targets.

Accept when:
- Static analysis confirms zero direct coupling between runtime providers and proxy targets outside the broker-proxy interface.
- All unit and integration tests for broker dispatch and proxy target resolution complete without errors.
- Repository test and build suites succeed under clean execution.

## Enforcement

- Verified by: Automated continuous integration pipeline execution checking module dependency boundaries and static analysis rules.
- Verified by: Peer code review for all modifications touching peer notebook proxy and broker components.
- Violation handling: Pull requests introducing direct dependencies that bypass the broker-proxy module will be blocked at continuous integration.
- Violation handling: Violations identified post-merge must be refactored into compliance as priority architectural defects.
- Exception process: Submit an architectural review request outlining why direct communication is required and detailing compensating decoupling controls.
- Exception process: Approved exceptions require formal sign-off from peer notebook lead engineers and must be documented with a sunset date.