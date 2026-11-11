---
version: 2
name: 0cd22b31-afdf-4f0b-b1a0-e663798c98bb-adoption-of-anthropic-ai-claude-agent-sdk-for-programmatic-agent-execution-programmatic-agent-invocations-use-anthropic-claude
description: "Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Programmatic Agent Invocations Use Anthropic Claude"
metadata:
  actual:
    adr_id: 0cd22b31-afdf-4f0b-b1a0-e663798c98bb
    status: accepted
    candidate_group_id: b816a7fa-1162-426b-b76b-c53571da15ab
    evidence:
      source: deep
  scope:
    root: .
    paths:
      - scripts/**
---

# Adoption of @anthropic-ai/claude-agent-sdk for Programmatic Agent Execution: Programmatic Agent Invocations Use Anthropic Claude

Status: proposed
Date: 2025-05-18
Deciders: Detection Pipeline (automated)

## Scope Paths

Root: `.` (whole repository)

Applies to:
- `scripts/**`

## Context

- Multiple automated agent and evaluation workflows require programmatic execution of language model agent tasks without human intervention.
- Autonomous harness execution requires programmatic controls over tool access, execution turn limits, and budget caps.
- The repository standardizes agent interactions using @anthropic-ai/claude-agent-sdk across automation scripts and evaluation runners.

## Problem Statement

Autonomous scripts and evaluation routines require a standard programmatic interface to run agent workloads with configurable tool permissions, budget ceilings, and turn limits while avoiding manual interactive confirmation prompts.

## Decision

1. MUST: Programmatic agent invocations MUST use @anthropic-ai/claude-agent-sdk through its query interface for autonomous execution.

## Policy Block

- MUST Programmatic agent invocations MUST use @anthropic-ai/claude-agent-sdk through its query interface for autonomous execution.

In scope:
- Programmatic agent execution harnesses
- Automated evaluation and probe scripts
- Unattended agent utility runners

Out of scope:
- Interactive command-line interfaces requiring human-in-the-loop permission prompts
- Direct client communication that does not involve agentic tool orchestration

Exceptions:
- EXC-20-001: A script requires interactive user approval for each tool invocation

## Rationale

- Adopting @anthropic-ai/claude-agent-sdk provides a uniform execution abstraction that encapsulates model prompting, tool coordination, and lifecycle management within a single query API.
- Bypassing permission prompts programmatically enables unattended execution for continuous evaluation, automated verification, and probing pipelines.
- Standardizing turn counts and financial budget parameters inside invocation options guards against infinite agent loops and unexpected operational expenses.

## Consequences

Positive:
- Centralized control over agent capabilities, budgets, and lifecycle configurations across automated routines.
- Elimination of interactive blocking prompts during automated agent test runs and evaluations.
- Predictable resource expenditure via enforced turn and monetary cost limits.

Negative:
- Elevated risk of unintended side effects when running with bypassPermissions without an external sandbox.
- Tight coupling to the specific configuration schemas and lifecycle models of @anthropic-ai/claude-agent-sdk.

## Alternatives

- Direct REST API client integrations with bespoke tool orchestration loops (rejected)
  Rejected because: Reimplements multi-turn tool calling, parsing, and context management across every script harness, increasing maintenance overhead
  When valid: When minimal dependencies are required and the interaction consists of single-turn prompting without tools
- External CLI process spawning with interactive stream piping (rejected)
  Rejected because: Lacks structured programmatic type definitions for options, results, and budget ceilings, creating fragile process-level dependencies
  When valid: When running pre-packaged standalone agent binaries in environments lacking module runtimes

## Risks

- Autonomous execution with permissionMode set to bypassPermissions could execute unintended system operations if broad tool scopes are granted
  Mitigation: Enforce minimal tool scopes via allowedTools and restrict script execution to containerized or controlled environments
  Owner: Engineering Team
- Upstream changes to the SDK query option schemas could break unattended harnesses across multiple scripts
  Mitigation: Pin resolved package versions in the lock artifact and verify public API documentation before updates
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
- Configure system prompts using standard preset mechanisms and append role-specific instructions dynamically per harness.
- Always set finite execution boundaries on both maxTurns and maxBudgetUsd in invocation options to guarantee termination.

## Continuation Context


Verify commands:
- Discover and run the project static analysis and type-checking scripts to verify query option schemas match library expectations.
- Discover and run the automated test suite targeting agent harnesses to ensure query execution terminates within defined constraints.

Accept when:
- Static analysis confirms all agent harness invocations adhere to the query option contracts of @anthropic-ai/claude-agent-sdk.
- Automated harness executions succeed non-interactively without encountering unbounded execution loops or unauthorized tool calls.

## Enforcement

- Verified by: Automated static analysis checks in continuous integration verifying schema conformance of query option parameters.
- Verified by: Code review ensuring proper declaration of allowedTools and budget limits.
- Violation handling: Block integration of code that invokes agent functionality without mandatory turn or budget ceilings.
- Violation handling: Flag and reject scripts enabling unvalidated permission bypass without bounded tool sets.
- Exception process: Submit an architectural review request with justification for alternative orchestration or interactive permission handling.