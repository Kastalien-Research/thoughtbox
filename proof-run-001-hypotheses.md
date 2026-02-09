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

_To be filled after run completes._
