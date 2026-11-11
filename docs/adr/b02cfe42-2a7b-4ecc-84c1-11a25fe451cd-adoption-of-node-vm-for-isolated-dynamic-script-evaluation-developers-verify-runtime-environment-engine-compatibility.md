---
version: 2
name: b02cfe42-2a7b-4ecc-84c1-11a25fe451cd-adoption-of-node-vm-for-isolated-dynamic-script-evaluation-developers-verify-runtime-environment-engine-compatibility
description: "Adoption of node:vm for Isolated Dynamic Script Evaluation: Developers Verify Runtime Environment Engine Compatibility"
metadata:
  actual:
    adr_id: b02cfe42-2a7b-4ecc-84c1-11a25fe451cd
    status: accepted
    candidate_group_id: 7d6e013f-5273-48a5-8cc8-0dd1de6ebde6
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - src/code-mode/**
---

# Adoption of node:vm for Isolated Dynamic Script Evaluation: Developers Verify Runtime Environment Engine Compatibility

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `src/code-mode/**`

## Context

- Tool implementations require programmatic filtering of catalog items and dynamic invocation of service SDK functions based on user-provided script strings.
- Direct evaluation of dynamic code within the host application process risks polluting the global namespace and leaking unauthorized execution capabilities.
- The codebase adopts the node:vm core module across dynamic tool components to establish controlled, isolated script execution environments.

## Problem Statement

Evaluating dynamic code strings directly within the application execution context exposes the host environment to state pollution, security vulnerabilities, and uncontrolled capability access. An isolated execution mechanism is required to execute user-provided arrow functions against controlled catalog data and service SDKs without exposing the host runtime.

## Decision

1. MUST: Developers MUST verify runtime environment engine compatibility and lock definitions in the project resolution artifact prior to invoking virtual machine execution APIs.

## Policy Block

- MUST Developers MUST verify runtime environment engine compatibility and lock definitions in the project resolution artifact prior to invoking virtual machine execution APIs.

In scope:
- Execution of dynamic query functions and user-provided script strings within tool invocation workflows.
- Runtime modules providing programmatic catalog search and service SDK orchestration through string evaluation.

Out of scope:
- Static module compilation and native application source execution within the primary application process.
- Declarative data filtering where static query parameters or schema-based filters are evaluated without dynamic scripting.

## Rationale

- Evidence from dynamic search and execution tools demonstrates that user-provided JavaScript functions are accepted as validated strings to query catalogs and orchestrate SDK operations.
- The node:vm core module provides explicit context creation and script evaluation primitives that decouple dynamic script execution from the host process global namespace.
- Combining schema validation with virtual machine context isolation establishes defense in depth against unintended side effects during dynamic evaluation.

## Consequences

Positive:
- Isolates dynamic script evaluation inside dedicated virtual machine execution contexts, preventing direct contamination of the host process global environment.
- Enables programmatic querying and service orchestration through expressive arrow functions while maintaining strict execution boundaries.
- Standardizes dynamic execution mechanics across all search and execution tool implementations using a unified core module abstraction.

Negative:
- Context initialization and boundary crossings introduce execution overhead compared to native in-process function invocation.
- Asynchronous execution within virtual machine contexts requires explicit timeout monitoring and promise management to prevent hanging host threads.
- Virtual machine isolation requires explicit configuration of exposed global objects to avoid accidental capability leakage.

## Alternatives

- Direct evaluation using host runtime evaluation constructors (rejected)
  Rejected because: Direct evaluation executes within the host process scope, granting untrusted or dynamic scripts unrestricted access to the application global namespace and execution closure.
  When valid: Only in internal performance-critical components where evaluated strings are generated exclusively by trusted internal compilers rather than dynamic user inputs.
- Out-of-process container or external worker process execution (deferred)
  Rejected because: Spawning separate processes or containers for lightweight catalog filtering and SDK execution introduces prohibitive latency and operational infrastructure overhead.
  When valid: When executing untrusted multi-tenant code requiring kernel-level resource isolation and protection against hostile native binary execution.

## Risks

- Hostile or malformed dynamic scripts may induce infinite loops or unhandled rejections that consume host thread resources.
  Mitigation: Enforce execution timeouts and resource boundaries on all virtual machine invocations, accompanied by pre-execution schema validation.
  Owner: Engineering Team
- Accidental leakage of sensitive host primitives or broad module capabilities into virtual machine context globals.
  Mitigation: Explicitly construct context objects with minimal, frozen API surfaces rather than inheriting or passing the ambient global scope.
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
- Construct isolated evaluation contexts using explicit object mappings containing only documented SDK interfaces and data catalog models.
- Capture evaluation output through structured serialization boundaries to sanitize data returning from virtual machine execution into host memory.

## Continuation Context


Verify commands:
- Discover and run the repository validation scripts that verify dynamic script execution and sandboxed context boundaries.
- Execute the test suite verifying timeout enforcement and global isolation within dynamic execution tool modules.

Accept when:
- All test suites evaluating dynamic code execution within virtual machine contexts pass without isolation or timeout regressions.
- Static analysis and test assertions confirm dynamic code strings are evaluated exclusively through virtual machine contexts without host process evaluation primitives.

## Enforcement

- Verified by: Automated continuous integration pipelines executing test suites and static analysis rules.
- Verified by: Mandatory architectural and code review of all changes to dynamic evaluation and tool execution boundaries.
- Violation handling: Direct invocation of host evaluation mechanisms outside virtual machine contexts blocks integration and triggers immediate remediation.
- Violation handling: Pull requests lacking timeout enforcement or pre-execution validation on dynamic scripts are rejected during review.
- Exception process: Exceptions require documented architectural rationale and formal sign-off from the technical lead.