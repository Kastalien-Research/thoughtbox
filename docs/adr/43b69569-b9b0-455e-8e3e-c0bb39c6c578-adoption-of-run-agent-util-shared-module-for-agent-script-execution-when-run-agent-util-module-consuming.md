---
version: 2
name: 43b69569-b9b0-455e-8e3e-c0bb39c6c578-adoption-of-run-agent-util-shared-module-for-agent-script-execution-when-run-agent-util-module-consuming
description: "Adoption of run-agent-util Shared Module for Agent Script Execution: When Run Agent Util Module Consuming"
metadata:
  actual:
    adr_id: 43b69569-b9b0-455e-8e3e-c0bb39c6c578
    status: accepted
    candidate_group_id: dbcbf6f3-19d4-45d2-ae7b-6c709b902874
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/agents/**
---

# Adoption of run-agent-util Shared Module for Agent Script Execution: When Run Agent Util Module Consuming

Status: proposed
Date: 2025-05-14
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `scripts/agents/**`

## Context

- Autonomous agent scripts require consistent command-line parameter handling, budget controls, and execution lifecycle management across fifteen distinct agent implementations.
- Direct inline orchestration within individual scripts leads to divergence in error reporting, logging formats, and configuration parsing.
- A centralized internal runner module was introduced to encapsulate common execution and environment handling routines across the agent suite.

## Problem Statement

Autonomous agent scripts across the repository require standardized CLI parameter parsing, execution budgeting, error formatting, and agent query orchestration. Without an established shared module, each agent script risks duplicating runner routines and diverging in configuration handling.

## Decision

1. MUST: When the run-agent-util module or consuming scripts interact with versioned external dependencies, consumers MUST inspect the repository lock artifact to determine exact resolved versions prior to integration.

## Policy Block

- MUST When the run-agent-util module or consuming scripts interact with versioned external dependencies, consumers MUST inspect the repository lock artifact to determine exact resolved versions prior to integration.

In scope:
- All autonomous agent automation scripts designed to invoke agent workflows, parse command-line arguments, and enforce budget constraints.

Out of scope:
- Utility modules and scripts that do not instantiate or orchestrate autonomous agent executions.

## Rationale

- Fifteen agent scripts uniformly rely on the shared run-agent-util module, demonstrating an established architectural decision to centralize runner concerns.
- Encapsulating agent invocation routines into a single first-party module ensures that budget validation and error handling stay coherent across all automation workflows.

## Consequences

Positive:
- Guarantees consistent command-line argument handling, execution budgeting, and error logging across all agent scripts.
- Centralizes agent runtime orchestration, environment validation, and query dispatching in a single shared module.
- Reduces boilerplate and ongoing maintenance overhead when introducing new specialized agent workflows.

Negative:
- Creates a central dependency where breaking interface modifications impact all dependent agent scripts simultaneously.
- May incentivize adding agent-specific edge cases into the shared utility module over time.

## Alternatives

- Decentralized inline agent orchestration within each individual agent script (rejected)
  Rejected because: Introduces severe code duplication and causes drift in parameter parsing, budgeting constraints, and error reporting across scripts.
  When valid: Throwaway single-file prototypes created outside the maintained automation test and execution suite.
- Direct unmediated external SDK calls in each agent script without an internal utility layer (rejected)
  Rejected because: Exposes every agent script directly to third-party SDK signature changes and duplicates runtime environment validation.
  When valid: Standalone external integration consumers that do not participate in the internal agent tooling architecture.

## Risks

- A regression or breaking signature change in the shared runner utility impacts all dependent agent scripts simultaneously.
  Mitigation: Maintain behavioral contract tests and integration suites covering the shared utility functions to prevent breaking downstream scripts.
  Owner: engineering team
- The shared runner utility accumulates disparate domain-specific logic, over-complicating the common interface.
  Mitigation: Keep the shared utility focused strictly on invocation orchestration, argument extraction, and budgeting primitives.
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
- Consume runtime coordination functions directly from the shared utility module when configuring agent prompts and budget parameters.
- Isolate agent-specific prompts, tool allowances, and model configurations in the consuming script while delegating dispatching to the shared utility.

## Continuation Context


Verify commands:
- Discover the project's test runner and static analysis scripts from the dependency manifest, then execute the suite that verifies imports of the internal shared runner module across agent scripts.
- Discover the repository's structural validation command and execute it to verify that all agent runner scripts resolve dependencies through the shared utility module.

Accept when:
- All agent automation scripts resolve their execution lifecycle and runner functions through the internal run-agent-util shared module without dependency errors.
- Static analysis and automated test suites confirm zero duplicate agent execution boilerplate or redundant argument parsing routines across agent scripts.

## Enforcement

- Verified by: Automated static analysis and module boundary checks during continuous integration.
- Verified by: Peer code review for all additions or updates to agent automation scripts.
- Violation handling: Pull requests containing duplicated runner logic or bypassing the shared utility are blocked from merging.
- Violation handling: Violating scripts must be refactored to delegate agent execution to the shared utility module.
- Exception process: Submit an architectural change request detailing the unique execution lifecycle requirements that cannot be met by the shared runner utility.
- Exception process: Obtain architectural approval before introducing standalone runner routines or diverging execution wrappers.