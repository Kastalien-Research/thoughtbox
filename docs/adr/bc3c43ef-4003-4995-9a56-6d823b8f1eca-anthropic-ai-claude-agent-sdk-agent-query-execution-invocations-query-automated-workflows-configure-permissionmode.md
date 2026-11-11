---
version: 2
name: bc3c43ef-4003-4995-9a56-6d823b8f1eca-anthropic-ai-claude-agent-sdk-agent-query-execution-invocations-query-automated-workflows-configure-permissionmode
description: "@anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Query Automated Workflows Configure Permissionmode"
metadata:
  actual:
    adr_id: bc3c43ef-4003-4995-9a56-6d823b8f1eca
    status: accepted
    candidate_group_id: 1dc656d5-f6af-4759-8d9d-545af3c26b3b
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
      - src/evaluation/**
      - src/sessions/**
---

# @anthropic-ai/claude-agent-sdk Agent Query Execution: Invocations Query Automated Workflows Configure Permissionmode

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `scripts/**`
- `src/evaluation/**`
- `src/sessions/**`

## Context

- Automated agent harnesses, verification judges, and evaluation probes require programmatic execution of model-driven tasks without human interaction.
- Unconstrained autonomous agent executions risk unbounded resource expenditures, unintended tool operations, and hanging processes waiting for manual approval.
- The codebase standardizes autonomous agent invocations around the query interface provided by @anthropic-ai/claude-agent-sdk with explicit execution envelopes.

## Problem Statement

Autonomous scripts and evaluation harnesses need to invoke model agents headlessly while preventing interactive prompt blocking, restricting tool access to necessary capabilities, and bounding execution costs and turn limits.

## Decision

1. MUST: Invocations of query in automated workflows MUST configure permissionMode as bypassPermissions to permit headless execution without blocking on interactive prompts.

## Policy Block

- MUST Invocations of query in automated workflows MUST configure permissionMode as bypassPermissions to permit headless execution without blocking on interactive prompts.

In scope:
- Automated scripts, harnesses, and pipelines invoking model agents headlessly.
- Evaluation benchmarks and verification probes utilizing agentic workflows.

Out of scope:
- Interactive developer sessions requiring step-by-step human confirmation.
- Direct database or cache access routines not involving agent orchestration.

## Rationale

- Multiple independent automation scripts require headless agent execution without blocking on human interaction.
- Standardizing on @anthropic-ai/claude-agent-sdk query with structured options allows consistent enforcement of budget limits and tool allowlists across the repository.
- The pattern aligns with observed usage across eight harness and runner modules, establishing a uniform calling convention.

## Consequences

Positive:
- Provides deterministic, non-blocking execution for automated evaluation, testing, and verification harnesses.
- Enforces operational guardrails through explicit tool allowlists and monetary budget limits.
- Standardizes agent invocation options across all headless automation modules.

Negative:
- Bypassing permissions places the complete safety burden on tool allowlists and prompt constraints.
- Creates tight coupling between automation scripts and the specific options schema of @anthropic-ai/claude-agent-sdk.

## Alternatives

- Direct REST client integrations for raw model queries (rejected)
  Rejected because: Lacks native agent orchestration, iterative tool execution loops, and automated permission configuration provided by the agent SDK.
  When valid: Valid for simple, single-turn text completions that do not require tool use or multi-turn agentic workflows.
- Interactive CLI-based agent invocations requiring manual confirmation prompts (rejected)
  Rejected because: Incompatible with automated evaluation suites, headless probes, and continuous integration workflows.
  When valid: Valid during local exploratory debugging where human review of each tool execution is desired.

## Risks

- Bypassing permissions in automated execution could permit unintended modifications if allowed tools include write or command execution capabilities.
  Mitigation: Constrain allowedTools strictly to read-only capabilities unless task requirements explicitly mandate modification tools.
  Owner: Engineering Team
- Failure to set budget caps could cause runaway billing during recursive or looping agent executions.
  Mitigation: Enforce mandatory maxBudgetUsd and maxTurns limits across all automated harness invocations.
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
- When constructing options for query invocations, always define budget and turn limits to prevent runaway resource consumption during automated test runs or batch evaluation.
- Tool permissions must adhere to the principle of least privilege, passing only the necessary tool identifiers into the allowed tools list for each specific agent task.

## Continuation Context


Verify commands:
- Discover the project's test runner from the repository configuration and execute tests covering agent query harnesses.
- Discover the static analysis tool and run linting rules to validate query option configurations.

Accept when:
- All static verification and type checks pass with zero errors across all agent execution harnesses.
- Invocations of query validate that required budget caps and tool allowlists are supplied prior to execution.

## Enforcement

- Verified by: Code review verification of all query invocation options.
- Verified by: Static analysis rules checking for required budget and permission configurations in agent runner modules.
- Violation handling: Pull requests omitting explicit tool allowlists or budget caps must be blocked until compliant options are configured.
- Exception process: Exceptions for unconstrained or interactive execution require documented rationale and approval from the architecture team.