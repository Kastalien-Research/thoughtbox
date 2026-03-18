---
name: session-review
description: Generate a structured session summary for cross-session continuity. Captures key decisions, hypotheses, partial work, and knowledge references. Output is written to .claude/session-handoff.json for the next session to load automatically.
argument-hint: [optional: focus area or notes]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---

Generate a structured session summary for cross-session continuity.

## Context

$ARGUMENTS

## Loop Building Blocks

| Loop | Purpose | Reference |
|------|---------|-----------|
| Consistency Check | Validate session summary against evidence | @loops/refinement/consistency-check.md |
| Documentation | Generate structured session review | @loops/authoring/documentation.md |

See @loops/README.md for the full loop library.

## Workflow

### Phase 1: Gather Session State (Observe)

1. Run `git log --oneline -20` to see recent commits this session
2. Run `git status` to see uncommitted work
3. Run `git diff --stat` to see scope of changes
4. Run `bd list --status=in_progress` to see active work items
5. Run `bd list --status=open` to see remaining work
6. Check `.claude/state/memory-calibration.json` for pattern detection state
7. Read MEMORY.md for any updates made this session

### Phase 2: Synthesize Session Context (Orient)

From the gathered data, identify:

1. **Key Decisions**: What architectural or design choices were made and why
2. **Open Hypotheses**: What questions remain unanswered, what investigations are pending
3. **Partial Work**: What was started but not finished, with enough context to resume
4. **Knowledge Discovered**: New patterns, gotchas, or insights worth preserving
5. **Blocked Items**: What's blocked and on what
6. **Next Steps**: What the next session should prioritize

### Phase 3: Write Session Handoff (Act)

Write the session summary to `.claude/session-handoff.json` (single file, overwritten each time) using this schema:

```json
{
  "version": "1.0.0",
  "session_id": "<from git or beads>",
  "timestamp": "<ISO 8601>",
  "branch": "<current git branch>",
  "duration_estimate": "<approximate session duration>",
  "summary": "<1-2 sentence summary of what happened>",
  "key_decisions": [
    {
      "decision": "<what was decided>",
      "reasoning": "<why>",
      "alternatives_considered": ["<alt1>", "<alt2>"],
      "files_affected": ["<file1>", "<file2>"]
    }
  ],
  "hypotheses": [
    {
      "hypothesis": "<what's being investigated>",
      "evidence_for": ["<supporting evidence>"],
      "evidence_against": ["<counter evidence>"],
      "next_test": "<what to try next>"
    }
  ],
  "partial_work": [
    {
      "description": "<what was started>",
      "status": "<how far along>",
      "resume_from": "<specific file:line or commit to resume from>",
      "beads_id": "<if tracked in beads>"
    }
  ],
  "knowledge_references": [
    {
      "store": "<MEMORY.md | Thoughtbox | Beads | git>",
      "reference": "<specific entity/issue/commit>",
      "relevance": "<why the next session needs this>"
    }
  ],
  "blocked_items": [
    {
      "item": "<what's blocked>",
      "blocker": "<what's blocking it>",
      "workaround": "<if any>"
    }
  ],
  "failed_approaches": [
    {
      "what": "<what was tried>",
      "why": "<why it failed>",
      "lesson": "<what to do instead>"
    }
  ],
  "next_priorities": ["<priority 1>", "<priority 2>", "<priority 3>"],
  "warnings": ["<things the next session should watch out for>"]
}
```

### Phase 4: Verify and Report (Decide)

1. Verify the handoff file was written successfully
2. Print a human-readable summary to the console
3. If there are uncommitted changes, warn about them
4. Suggest `bd sync --from-main` if on an ephemeral branch

## Output

Present a concise summary:

```
## Session Handoff Written

File: .claude/session-handoff.json
Branch: {branch}
Commits this session: {N}
Active beads: {N}
Open hypotheses: {N}
Partial work items: {N}

### Top 3 Priorities for Next Session
1. {priority}
2. {priority}
3. {priority}

### Warnings
- {warning}
```
