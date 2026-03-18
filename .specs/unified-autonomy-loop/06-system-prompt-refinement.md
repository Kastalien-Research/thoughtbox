# 08. System Prompt Refinement

**Status**: Draft

## Overview

A core component of the Thoughtbox self-improvement loop is the **System Prompt Refinement** process. This phase describes how the system synthesizes learnings from individual execution sessions and distills them into durable context updates (such as `.claude/rules/*.md` and `AGENTS.md`). 

The goal is to convert ephemeral, chat-transcript knowledge—like recurring errors, newly discovered project patterns, or declared developer preferences—into persistent instructions that all future agent sessions immediately inherit. By versioning the "brain" alongside the codebase, Thoughtbox ensures the AI's operational baseline continuously rises without bloat.

## The Optimization Loop

The refinement loop is executed manually (via the `/workflow-compound` or `session-review` tools) or scheduled offline:

### 1. Knowledge Extraction

During a session review, the system analyzes the current transcript and recently completed `.beads` issues for:
- **Friction Points:** Where did the agent get stuck? What tool calls failed repeatedly?
- **Anti-Patterns:** Did the agent choose an inefficient architectural approach that the developer had to correct?
- **Preferences:** Did the developer state a new workflow rule (e.g., "From now on, always add a bead before creating a branch")?

This step utilizes tools like `knowledge`, `synthesize`, and `session-review` to parse the noise from the signal.

### 2. Rule Categorization

Not all knowledge belongs in the same place. The system categorizes extracted learnings into the appropriate context files:
- **`AGENTS.md`:** Universal, project-wide rules (e.g., core branching strategy, the definition of done).
- **`.claude/rules/*.md`:** Path-scoped semantics (e.g., rules specific to testing in `src/tests`, or typing rules in `src/types`).
- **`.adr/` or `.specs/`:** If the learning is a structural decision, it may become an Architecture Decision Record or a formal spec update.

### 3. Diff Generation

The agent proposes targeted, minimal modifications to the selected markdown files. The focus is on brevity to preserve the agent's context window. 
- *Instead of:* "When you write a test, you should probably use vitest and try to mock the database..."
- *Use:* "Tests: Use vitest. Mock database adapters (do not use live connections)."

Tools like `capture-learning` help codify these diffs.

### 4. Review & Commit

The proposed systemic rule updates are presented to the developer (via a PR or direct staging). Once merged, the updated rules are committed to the repository. The Thoughtbox "brain" versions symmetrically with the code it manages.

## Impact on Subsequent Loops

As context updates accumulate:
- The rate of repetitive errors decreases.
- The cost per issue drops, as agents require fewer turns to arrive at the correct structural approach.
- The orchestration layer (`02-orchestration-agentops.md`) and workflow composer (`03-workflow-composition.md`) naturally inherit improved foundational reasoning constraints.

## Tooling Dependencies

- `knowledge` / `synthesize`
- `capture-learning` / `/workflow-compound`
- Standard Git/PR tools for review.
