# Agent Invocation Architecture

> **Priority**: CRITICAL - Should have been documented FIRST
> **Created**: 2026-01-21
> **Status**: Draft - Fills critical gap in SIL documentation

## The Missing Piece

The SIL specs describe orchestration (phases, costs, termination) and infrastructure (evaluator, sampler, contamination detection), but they never specify:

1. **WHO is the agent?** - What entity actually writes code?
2. **HOW does the agent get invoked?** - What mechanism triggers Claude?
3. **What are the trigger modes?** - How does autonomous operation begin?

This document fills that gap.

---

## Two Trigger Modes

The Self-Improvement Loop operates in **two modes**:

### Mode 1: GitHub Actions (Automated)

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS MODE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐  │
│  │   Schedule   │────▶│   Workflow   │────▶│   npm run   │  │
│  │  (cron: 2AM) │     │    (.yml)    │     │ improvement │  │
│  └──────────────┘     └──────────────┘     │    -loop    │  │
│                                            └──────┬──────┘  │
│                                                   │         │
│                                                   ▼         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                ENTRY POINT SCRIPT                    │   │
│  │            src/improvement/cli.ts (TBD)              │   │
│  │                                                      │   │
│  │  - Reads config (budget, max iterations)             │   │
│  │  - Instantiates AutonomousImprovementLoop            │   │
│  │  - Calls Anthropic API for each phase               │   │
│  │  - Tracks costs, emits events                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  AGENTS INVOLVED:                                           │
│  - Discovery: Haiku API calls (cheap scanning)              │
│  - Filter: Haiku API calls (relevance scoring)              │
│  - Experiment: Sonnet API calls (code generation)          │
│  - Evaluate: Test execution (no LLM)                       │
│  - Integrate: Claude Code Action (PR creation)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Implementation**: `src/improvement/cli.ts` → `AutonomousImprovementLoop.run()` → Anthropic SDK calls

### Mode 2: Ad-Hoc via Claude Code (Interactive)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE MODE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────────────────────────┐  │
│  │    User      │────▶│         Claude Code              │  │
│  │  (you, now)  │     │  (CLI or web interface)          │  │
│  └──────────────┘     └──────────────┬───────────────────┘  │
│                                      │                       │
│                        "Run the improvement loop"            │
│                                      │                       │
│                                      ▼                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CLAUDE CODE AGENT                       │   │
│  │                                                      │   │
│  │  Claude Code IS the agent. It:                      │   │
│  │  - Reads the codebase                               │   │
│  │  - Identifies improvement opportunities             │   │
│  │  - Makes code changes using Edit/Write tools        │   │
│  │  - Runs tests using Bash tool                       │   │
│  │  - Commits and creates PRs using Bash (git/gh)     │   │
│  │                                                      │   │
│  │  NOTE: Cannot use Thoughtbox MCP (not available     │   │
│  │  in Claude Code web context by default)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  AGENTS INVOLVED:                                           │
│  - Claude Code itself (Opus/Sonnet depending on user)      │
│  - Uses bash commands, file tools, NOT Anthropic API       │
│  - Single agentic session, not multi-phase loop            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Implementation**: User invokes Claude Code → Claude Code reads specs → Claude Code executes improvement workflow

---

## Agent Invocation Details

### Mode 1: Anthropic API Calls (GitHub Actions)

The `npm run improvement-loop` script needs to:

1. **Initialize Anthropic SDK client**
   ```typescript
   import Anthropic from "@anthropic-ai/sdk";
   const client = new Anthropic();
   ```

2. **Call Claude for each phase**
   ```typescript
   // Discovery phase - cheap Haiku calls
   const discoveries = await client.messages.create({
     model: "claude-3-5-haiku-latest",
     max_tokens: 1000,
     system: DISCOVERY_SYSTEM_PROMPT,
     messages: [{ role: "user", content: discoveryPrompt }]
   });

   // Experiment phase - Sonnet for code generation
   const modification = await client.messages.create({
     model: "claude-sonnet-4-20250514",
     max_tokens: 4000,
     system: CODE_GENERATION_PROMPT,
     messages: [{ role: "user", content: experimentPrompt }]
   });
   ```

3. **Track costs from API responses**
   ```typescript
   const inputTokens = response.usage.input_tokens;
   const outputTokens = response.usage.output_tokens;
   tracker.addCost(calculateCost(model, inputTokens, outputTokens));
   ```

### Mode 2: Claude Code Agentic Session

No Anthropic API code needed - Claude Code IS the agent:

1. **User invokes Claude Code** (CLI or web)
2. **User gives task**: "Run the self-improvement loop"
3. **Claude Code reads specs**: Uses Read tool to understand SIL architecture
4. **Claude Code executes phases**:
   - Discovery: Grep/Glob to find issues, Read to analyze
   - Filter: Reasoning about relevance
   - Experiment: Edit/Write to make changes
   - Evaluate: Bash to run tests
   - Integrate: Bash git commands to commit

**Key difference**: In Mode 2, Claude Code's reasoning IS the improvement reasoner. No separate API calls to Claude - Claude Code is already Claude.

---

## What's Missing from Implementation

### For Mode 1 (GitHub Actions)

| Component | Status | What's Needed |
|-----------|--------|---------------|
| Entry point CLI | NOT STARTED | `src/improvement/cli.ts` |
| Anthropic SDK integration | NOT STARTED | Wrap loop phases with API calls |
| Prompt templates | NOT STARTED | System prompts for each phase |
| Cost tracking from API | NOT STARTED | Parse response.usage |
| GitHub Actions workflow | NOT STARTED | SIL-011 |

### For Mode 2 (Claude Code)

| Component | Status | What's Needed |
|-----------|--------|---------------|
| Skills/workflow | NOT STARTED | `/improvement-loop` skill |
| Spec awareness | PARTIAL | Claude Code can read specs |
| Test execution | READY | Bash tool works |
| Code modification | READY | Edit/Write tools work |
| PR creation | READY | gh CLI available |

---

## Implementation Plan

### Phase A: Enable Mode 2 First (Lower Effort)

Since Claude Code IS already an agent with all needed tools, Mode 2 can work with just:

1. **Document the workflow** for Claude Code to follow
2. **Create a skill** (`/improvement-loop`) that guides Claude Code through phases
3. **Test interactively** - user initiates, watches Claude Code work

This provides immediate value without new code.

### Phase B: Build Mode 1 (Higher Effort)

1. **Create CLI entry point** (`src/improvement/cli.ts`)
2. **Add Anthropic SDK calls** to `AutonomousImprovementLoop`
3. **Implement prompt templates** for each phase
4. **Add GitHub Actions workflow** (SIL-011)
5. **Test end-to-end** with low budget

---

## Unanswered Questions

1. **Thoughtbox usage in Mode 2**: Claude Code web doesn't have Thoughtbox MCP by default. Should we:
   - Skip Thoughtbox reasoning in Mode 2?
   - Require users to configure Thoughtbox MCP?
   - Use a simplified reasoning approach?

2. **Handoff between modes**: If GitHub Actions runs and finds improvements, should it:
   - Auto-merge if tests pass?
   - Create PR for human review?
   - Notify user to continue in Mode 2?

3. **Budget management**: How does Mode 2 track cost? Claude Code doesn't expose API costs to itself.

---

## Summary

**The specs describe WHAT to do but not HOW the agent actually operates.**

- **Mode 1 (GitHub Actions)**: Anthropic API calls from a script
- **Mode 2 (Claude Code)**: Claude Code IS the agent, uses its existing tools

Both modes run the same conceptual loop (Discovery → Filter → Experiment → Evaluate → Integrate), but the invocation mechanism is fundamentally different.

**This architecture should have been the FIRST thing documented before any SIL specs were written.**
