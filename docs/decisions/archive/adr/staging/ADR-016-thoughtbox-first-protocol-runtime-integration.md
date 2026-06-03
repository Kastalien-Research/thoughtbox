# ADR-016: Thoughtbox-First Protocol Runtime Integration

**Status**: Proposed
**Date**: 2026-03-29
**Deciders**: Thoughtbox development team

## Context

ADR-015 established `thoughtbox_ulysses` and `thoughtbox_theseus` as first-class MCP tools backed by Thoughtbox storage. That work solved discoverability and canonical persistence, but the local Claude runtime still drifts in three ways:

1. Ulysses hook behavior is derived from local shell state and generic command failures rather than authoritative protocol state.
2. Theseus enforcement is documented but not wired into the active Claude hook path.
3. The default local protocol skills still describe bash-driven state transitions, which implies local `.ulysses/`, `.theseus/`, and git-side effects that are not part of the canonical Thoughtbox runtime.

This causes the current implementation to split authority between Thoughtbox and local shell behavior. It also makes knowledge capture inconsistent because reflections and failures can happen locally without being recorded as durable Thoughtbox artifacts.

## Decision

Adopt a Thoughtbox-first runtime split for Ulysses and Theseus:

- Thoughtbox remains the only authority for protocol state and transitions.
- Claude-side skills become explicit invoke adapters, not protocol engines.
- Claude-side hooks become deterministic enforcement clients that query Thoughtbox-backed state before local mutations.
- No new local Node daemons are introduced. Local enforcement targets the Dockerized Thoughtbox server at `http://localhost:1731/mcp`.
- Helper agents may gather evidence or audit checkpoints, but only the coordinator agent advances protocol state.

## Implementation

### 1. Server-backed enforcement surface

Add a hook-facing HTTP route on the Thoughtbox server that returns a single enforcement decision for pending local mutations.

- Ulysses blocks when the active session requires `reflect`.
- Theseus blocks test-file edits and out-of-scope writes.
- The route returns `required_action` so Claude hooks can report the exact next step.

### 2. Shared protocol authority

Use the same protocol handler instance for MCP operations and the enforcement route so local mode and Supabase-backed mode cannot diverge.

### 3. Claude-side adapter rewrite

Rewrite the Ulysses and Theseus skill docs to direct explicit Thoughtbox protocol-tool usage.

- Bootstrap Thoughtbox session/cipher as needed.
- Call the authoritative protocol tool.
- Render the next required action from the returned server state.
- Retire local bash scripts from the default protocol path.

### 4. Knowledge-yielding protocol flow

Keep terminal summary bridging and add reusable knowledge capture for:

- Ulysses reflections
- Theseus audit failures
- Theseus scope exhaustion summaries

## Consequences

### Positive

- One authority model for protocol state in both Claude and non-Claude runtimes.
- Local hooks enforce real protocol state instead of approximating it.
- Local development uses the existing Dockerized Thoughtbox server rather than new wrapper daemons.
- Protocol failures and reflections become durable knowledge, not transient shell behavior.

### Tradeoffs

- Local hook enforcement now depends on the local Thoughtbox server being reachable.
- Claude-side skills become thinner and less shell-driven, which removes some legacy local scripting convenience.
- Cross-runtime helper-agent orchestration stays explicit in v1; hooks do not auto-spawn agents.

## Hypotheses

### Hypothesis 1: Thoughtbox-backed enforcement can replace local Ulysses drift
**Prediction**: When an active Ulysses session reaches `S=2`, the Claude pre-tool hook blocks mutating actions and reports `required_action: "reflect"` without relying on `.ulysses/` state.
**Validation**: Start a Ulysses session, drive it to `S=2`, call the local enforcement route, and verify the hook blocks mutation until `reflect` completes.
**Outcome**: PENDING

### Hypothesis 2: Thoughtbox-backed enforcement can make Theseus scope rules real in Claude
**Prediction**: During an active Theseus session, test-file writes and out-of-scope writes are blocked through the Claude pre-tool hook until the appropriate protocol step is recorded.
**Validation**: Start a Theseus session, request enforcement for a test path and an out-of-scope path, and verify blocked responses with the expected reasons.
**Outcome**: PENDING

### Hypothesis 3: Explicit adapter skills can preserve portability while keeping local UX intact
**Prediction**: Rewritten Claude skill instructions can drive the full Ulysses and Theseus lifecycles against the local Dockerized Thoughtbox server without relying on local protocol state directories or shell-managed git actions.
**Validation**: Walk the documented skill flow for both protocols against `http://localhost:1731/mcp` and verify that all state transitions occur through Thoughtbox responses.
**Outcome**: PENDING

## Spec

[SPEC: Thoughtbox-First Protocol Runtime Integration](../../.specs/protocol-runtime-integration.md)

## Links

- [ADR-015: Protocol MCP Tools](../accepted/ADR-015-protocol-mcp-tools.md)
- [ADR-013: Knowledge Storage Project Scoping](../accepted/ADR-013-knowledge-storage-project-scoping.md)
- `.claude/skills/ulysses-protocol/SKILL.md`
- `.claude/skills/theseus-protocol/SKILL.md`
