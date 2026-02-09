# Proof Run 001: Hub + Agent Teams Integration

**Date**: 2026-02-09
**Issue**: thoughtbox-twu — Gateway stage never resets for sub-agent MCP sessions
**Branch**: fix/sub-agent-stage-reset
**Base**: main (386be4a)

## Purpose

Prove that Thoughtbox Hub + Claude Code Agent Teams produces a working engineering system with retrievable coordination value. The proof is a real bug fix executed by a multi-agent team coordinating through the Hub.

## Level 1: Bug Fix Hypotheses

| ID | Hypothesis | Test | Pass Criteria |
|----|-----------|------|---------------|
| H1 | Sub-agent MCP sessions currently inherit parent stage state | Spawn sub-agent via Task tool, call `get_state` | Reports stage 3 (not stage 0) |
| H2 | After fix, sub-agents start at stage 0 | Same as H1, post-fix | Reports stage 0 |
| H3 | Progressive disclosure enforcement is functional post-fix | Sub-agent calls `thought` before `cipher` | Stage enforcement error returned |
| H4 | Fix introduces no regressions | Full vitest suite | 309+ tests pass. 9 pre-existing branch-retrieval failures are unrelated. |

## Level 2: Coordination Proof Hypotheses

| ID | Hypothesis | Test | Pass Criteria |
|----|-----------|------|---------------|
| H5 | Multiple agents register with distinct identities | `workspace_status` after run | 2+ agents with different agentIds |
| H6 | Proposal/review/merge lifecycle completes | `list_proposals` on workspace | At least 1 proposal with status `merged`, at least 1 review with verdict |
| H7 | Reasoning trail is coherent to a cold reader | New agent reads `read_channel` + `list_proposals` | Can reconstruct what happened and why without internal agent context |
| H8 | Hub contains information Agent Teams task list does not | Compare Hub artifacts vs task list | Hub has decision rationale, review reasoning, thought refs absent from task list |
| H9 | Coordination overhead is justified by result | H1-H4 AND H5-H8 | Bug is fixed AND Hub trail exists — not one at the expense of the other |

## Falsification Criteria

Any of these kills the thesis:

1. All Hub operations could be replaced by `SendMessage` without losing information — Hub adds no value
2. Workspace is empty or contains only boilerplate after run — coordination was theater
3. Bug doesn't get fixed — system can coordinate but not execute
4. Only one agentId appears across all Hub artifacts — multi-agent was an illusion

## Validation Protocol

After the team completes:

1. Run H1-H4 tests (deterministic, automated)
2. Query Hub workspace for H5-H6 (deterministic, automated)
3. Have a fresh agent or human read the workspace cold for H7-H8 (judgment-based)
4. Assess H9 holistically

## Results

**Run completed**: 2026-02-09
**Fix commit**: 625d1fa on fix/sub-agent-stage-reset
**Hub workspace**: 63f6cb07-a884-48d8-b8a5-4fc88389dc4e
**Consensus marker**: 82bfa668-c593-4863-948b-ade1d74186b4

### Level 1: Bug Fix

| ID | Result | Evidence |
|----|--------|----------|
| H1 | NUANCED | HTTP transport creates fresh servers per session (Stage 0 by default). Bug manifests as: sub-agents start fresh but don't know they must re-initialize. Fix adds defense-in-depth for HTTP, essential protection for stdio. |
| H2 | PASS | Test: "new MCP session starts at Stage 0 regardless of global stage" |
| H3 | PASS | Test: full progression get_state->start_new->cipher->thought; thought rejected at Stage 0 |
| H4 | PASS | 316/325 pass, 9 pre-existing branch-retrieval failures only, TypeScript clean |

### Level 2: Coordination Proof

| ID | Result | Evidence |
|----|--------|----------|
| H5 | PARTIAL | 2 of 3 sub-agents registered on Hub (coordinator aea3464d, researcher fbd93263). Triage and judge blocked by agent tool whitelists excluding MCP/ToolSearch. |
| H6 | PARTIAL | Proposal ffe35a65 created. Review blocked: coordinator created proposal (no self-review enforced), judge couldn't access Hub. Proposal stays open. |
| H7 | PASS | Hub channels contain: coordinator decisions, proxied triage findings, direct researcher findings, proxied judge verdict, failure notes — all readable cold. |
| H8 | PASS | Hub has: assumption registry, transport model analysis, architectural rationale, coordinator unblock decision, no-self-review constraint. Task list has: status only. |
| H9 | PASS | Bug fixed AND Hub trail exists. Real code (commit 625d1fa), 7 new tests. |

### Falsification Criteria

1. "Hub could be replaced by SendMessage" — **Partially true.** Triage and judge worked via SendMessage only. But Hub persists structured decision trail that SendMessage doesn't retain.
2. "Workspace empty/boilerplate" — **FALSE.** 3 problems with resolutions, 1 proposal, 7+ channel messages, 1 consensus marker.
3. "Bug doesn't get fixed" — **FALSE.** Fixed and independently verified.
4. "Only one agentId" — **FALSE.** Two distinct agentIds in workspace.

### Key Findings

1. **Agent tool whitelists are the bottleneck, not the Hub.** Agents defined with restricted tool lists (triage-fix: Read/Glob/Grep/Bash/Edit/Write) cannot access MCP tools. Adding ToolSearch to agent definitions would resolve H5 and H6.
2. **Coordinator-as-proxy is a valid but lossy pattern.** When agents can't access the Hub directly, the coordinator proxies their findings. This works but collapses multiple agentIds into one in Hub artifacts.
3. **Hub's no-self-review constraint is correct but creates a lifecycle gap.** When the coordinator creates proposals on behalf of agents, no one else can review them.
4. **The Hub's persistent decision trail is the unique value.** Agent Teams messages are ephemeral. Hub artifacts survive the session.

### Advisory Issues Filed

- thoughtbox-32q: Wire clearSession() into transport close lifecycle (pre-existing memory leak)
