---
version: 2
name: 3d5dec45-477d-4c55-a595-84721028b4fa-adoption-of-thought-handler-internal-core-module-for-cognitive-state-and-tool-execution-components-external-internal-thought-handler-module
description: "Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Components External Internal Thought Handler Module"
metadata:
  actual:
    adr_id: 3d5dec45-477d-4c55-a595-84721028b4fa
    status: accepted
    candidate_group_id: fa0345b7-c311-4530-bded-e2c530f35a17
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/protocol/**
      - src/sessions/**
      - src/thought/**
---

# Adoption of thought-handler Internal Core Module for Cognitive State and Tool Execution: Components External Internal Thought Handler Module

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/protocol/**`
- `src/sessions/**`
- `src/thought/**`

## Context

- The codebase implements multiple cognitive protocol tools and session restoration handlers that require consistent thought manipulation and anchor resolution.
- Disparate modules managing reasoning workflows and session state require a single authoritative interface to prevent diverging thought handling logic.
- Static analysis of imports across protocol endpoints, thought interaction tools, and session controllers reveals recurring reliance on the shared internal thought-handler module.

## Problem Statement

Without a unified core module for thought processing, disparate protocol implementations and session managers risk fragmenting cognitive lifecycle logic, resulting in inconsistent state transitions, divergent anchor caching, and duplicate validation semantics.

## Decision

1. MUST_NOT: Components external to the internal thought-handler module MUST NOT implement duplicate thought state parsing, anchor caching mechanisms, or direct thought mutation paths.

## Policy Block

- MUST_NOT Components external to the internal thought-handler module MUST NOT implement duplicate thought state parsing, anchor caching mechanisms, or direct thought mutation paths.

In scope:
- All protocol tool handlers and operational controllers that manage cognitive operations, reasoning workflows, or plan execution.
- Session restoration handlers and query controllers that parse, query, or cache thought nodes.

Out of scope:
- Pure utility modules and static data representations that do not manage cognitive state or execute thought lifecycles.

Exceptions:
- EXC-20-001: A transient mock or isolated test fixture requires synthesized thought behavior without invoking the full thought-handler execution pipeline.

## Rationale

- Centralizing thought operations within the internal thought-handler module establishes a single boundary for thought persistence, anchor resolution, and lifecycle coordination across diverse protocols.
- Enforcing a common interface avoids duplication of complex thought query and parsing mechanics across session restoration routines and specialized protocol tools.
- Decoupling protocol-specific validation schemas from core thought handling logic allows protocols to evolve their operational interfaces independently while preserving uniform thought semantics.

## Consequences

Positive:
- Provides a unified, authoritative interface for all thought querying, caching, and state transitions.
- Eliminates redundant thought parsing and anchor management logic across protocol endpoints and session controllers.
- Simplifies auditing, diagnostic logging, and error handling for cognitive execution failures.

Negative:
- Creates a centralized internal dependency that tightly couples protocol tools and session handlers to the thought-handler module interface.
- Requires schema validation layers to map protocol-specific parameters into thought-handler invocations, adding a translation boundary.

## Alternatives

- Decentralized Thought Management Across Individual Protocol Tools (rejected)
  Rejected because: Decentralizing thought logic causes state divergence, duplicate anchor caching algorithms, and inconsistent error recovery across different protocol implementations.
  When valid: Valid only in trivial architectures where only a single protocol interacts with thought structures.
- External Third-Party Workflow Engine (rejected)
  Rejected because: Introducing an external workflow engine introduces unnecessary operational overhead and fails to accommodate domain-specific thought anchoring and cognitive protocols.
  When valid: Valid when reasoning workflows require distributed multi-node orchestration across external enterprise systems.

## Risks

- Breaking changes to the thought-handler internal interface can simultaneously impact multiple protocol tools and session restoration.
  Mitigation: Maintain backward-compatible method signatures within the module and execute full integration suites before interface refactoring.
  Owner: Core Engineering Team
- Bottlenecks or caching inconsistencies within the shared thought query and anchor resolution pipeline.
  Mitigation: Enforce strict isolation between persistent thought queries and in-memory anchor cache layers with structured error logging on cache misses.
  Owner: Platform Architecture Team

## Implementation Notes

- DISCOVERY POLICY (MANDATORY): This ADR omits all tool names, file names, commands, package managers, and version numbers. The consumer MUST derive them from the project repository.

LOCK-VERSION GROUNDING (MANDATORY) — before writing code that uses a versioned library, execute in order:
1. Find the dependency manifest in the repo. It declares ranges, not installed versions.
2. Identify the build tool from the manifest.
3. Inspect the repository lock or resolution artifact to determine the exact resolved version. This artifact is authoritative; build-tool output only verifies the active environment matches it.
4. Look up the official documentation, changelog, or public API reference for that exact version. Do not use training-data recall — fetch or search the public internet for version-specific docs.
5. Confirm every API, class, or function you will call exists in that exact version's documentation before using it.
6. For version-sensitive behavior, re-run steps 3-5 per dependency at point of use.
- Consumers implementing new protocol tools must declare input validation schemas at the controller boundary before delegating domain operations to the internal thought-handler module.
- Session restoration handlers must isolate cache mutations from primary thought datastore queries to ensure partial restoration failures do not corrupt cached anchor states.

## Continuation Context


Verify commands:
- Discover and run the project's static analysis and module dependency boundary linter to verify that all protocol and session controllers import thought capabilities exclusively from the designated internal thought-handler module.
- Discover and execute the automated test suite covering session restoration and protocol tool operations to confirm unified thought lifecycle execution without regressions.

Accept when:
- Module boundary analysis confirms zero direct thought datastore mutations outside of the internal thought-handler module.
- All unit, integration, and protocol compliance tests pass with full schema validation and structured error handling verified.

## Enforcement

- Verified by: Automated continuous integration pipeline executing module dependency checks and static analysis linter rules.
- Verified by: Peer architectural code review for all modifications touching protocol tools, session handlers, or the internal thought-handler module.
- Violation handling: Automated build rejection when architectural boundary checks detect bypassed thought handling or duplicate state mutations.
- Violation handling: Code review block requiring refactoring to delegate thought lifecycles through the core module before merge.
- Exception process: Formal architectural variance request submitted to the Architecture Review Board detailing isolation constraints and test justification.