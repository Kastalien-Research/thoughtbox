---
name: bead-workflow
description: "The mandatory process for every unit of work. Use this skill whenever starting work on a bead, bug, feature, or task. Enforces claim → hypothesize → implement → test → validate → close → pause. Every transition is gated by PreToolUse hooks that block (exit 1) on violations. Ulysses REFLECT escalation activates automatically on 2 consecutive surprises. If you're about to write code, check a bead, close an issue, or start new work — this skill applies."
---

# Bead Workflow

Every unit of work follows this process. No exceptions.

The hooks enforce this. They don't remind. They don't suggest. They block. If you try to skip a step, your tool call fails with an error message telling you what to do first.

## The 7 Steps

### Step 1: Claim

```bash
bd update <id> --claim
```

The PostToolUse state writer creates `.claude/state/bead-workflow/current-bead.json` with:
```json
{"bead_id": "<id>", "claimed_at": "...", "hypothesis_stated": false}
```

You own this bead. No one else touches it.

### Step 2: Hypothesize

Before you write any code, state what you expect to change and why.

```bash
bd update <id> --notes="Hypothesis: <what will change and why it fixes the issue>"
```

The state writer sets `hypothesis_stated: true` in `current-bead.json`.

**The enforcer blocks all Edit/Write calls to `src/` and `supabase/migrations/` until this is done.** You literally cannot modify code without recording a hypothesis first. This exists because agents (including you) will skip this step if allowed to. You are not allowed to.

### Step 3: Implement

Write only the code that tests the hypothesis. Nothing else. No cleanup. No refactoring. No "while I'm here" improvements.

When you edit any file in `src/`, the state writer deletes the `tests-passed-since-edit` sentinel. This resets the test gate — you'll need to run tests again before you can close.

### Step 4: Test

Run the relevant tests. Not the full suite — the ones that prove or disprove your hypothesis.

```bash
npx vitest run <relevant-test-file>
```

When vitest passes clean (exit 0, no FAIL in output), the state writer creates the `tests-passed-since-edit` sentinel.

**If the test fails**, that's a **surprise**. Log it:

```bash
bd update <id> --notes="Surprise #1: <what actually happened vs what you expected>"
```

Update your hypothesis based on what you learned. Return to Step 3.

**If two consecutive surprises happen on the same bead**, the Ulysses escalation activates. See below.

### Step 5: Validate

State the result out loud — in your response to the user. Did the hypothesis hold? Did something unexpected happen? Did the test pass for the right reason?

This is not a formality. This is where you catch yourself before closing a bead you didn't actually verify. If you can't explain what the test proved, you haven't validated.

### Step 6: Close

```bash
bd close <id> --reason="<what was validated and how>"
```

**The enforcer blocks `bd close` if:**
- `tests-passed-since-edit` sentinel doesn't exist (you haven't run tests since your last code change)
- Multiple bead IDs in the command (each bead gets its own validation)

After a successful close, the state writer creates `.claude/state/bead-workflow/pending-validation.json` and deletes `current-bead.json`.

### Step 7: Pause

**You cannot start the next bead until the user confirms.**

The enforcer blocks all Edit/Write/Bash work commands while `pending-validation.json` exists. You can still:
- Read files (Read, Glob, Grep)
- Run tests and status checks
- Use `bd` commands
- Run `git status` / `git diff`

The user clears the gate:
```bash
touch .claude/state/bead-workflow/validation-confirmed
```

Only the user triggers this. You do not clear your own validation gate.

## Ulysses Escalation

Ulysses is not the default mode. It is the circuit breaker. Most beads complete in one pass through steps 1-7 without ever triggering it.

### When it activates

The Ulysses state writer counts consecutive command failures and test failures while a bead is in progress. When the count reaches 2:

- The `reflect-required` sentinel is written to `.claude/state/ulysses/`
- The Ulysses enforcer blocks ALL tool calls except: Read, Grep, Glob, `bd show`, `bd update --notes`, and REFLECT itself

### What you must do

1. Formulate a **falsifiable hypothesis** about why you're stuck
2. State a **falsification criterion** — specific, observable evidence that would disprove the hypothesis
3. Invoke Ulysses REFLECT (via the `thoughtbox_ulysses` tool or the `/ulysses-protocol` skill)

After REFLECT completes:
- The `reflect-required` sentinel is removed
- The surprise counter resets to 0
- Return to Step 3 with the new hypothesis

### When Ulysses activates too often

If you're hitting REFLECT on multiple beads, the problem is upstream:
- Beads are scoped too large — break them down
- Hypotheses are too vague — be more specific about what you expect
- You're guessing instead of reading — read the code before hypothesizing

## State Files

| File | Location | Created by | Cleared by | What it gates |
|------|----------|-----------|------------|---------------|
| `current-bead.json` | `.claude/state/bead-workflow/` | Step 1 (claim) | Step 6 (close) | Hypothesis check on code edits |
| `tests-passed-since-edit` | `.claude/state/bead-workflow/` | Step 4 (test pass) | Step 3 (code edit) | Close gate |
| `pending-validation.json` | `.claude/state/bead-workflow/` | Step 6 (close) | Step 7 (user confirms) | Next bead gate |
| `reflect-required` | `.claude/state/ulysses/` | 2nd surprise | REFLECT completion | Everything gate |

## Hooks

| Script | Event | Role |
|--------|-------|------|
| `bead_workflow_state_writer.sh` | PostToolUse | Records claims, hypothesis, test results, closes |
| `bead_workflow_enforcer.sh` | PreToolUse | Blocks code without hypothesis, close without tests, batch closes, work during pending validation |
| `ulysses_state_writer.sh` | PostToolUse | Counts surprises, writes reflect-required sentinel |
| `ulysses_enforcer.sh` | PreToolUse | Blocks everything when REFLECT is required |

The state writers read `tool_response.stdout` (not `tool_output`) from the PostToolUse JSON payload. This was verified by probe against live Claude Code.

Test all hooks before installing: `scripts/staged-hooks/test_hooks.sh` (15/15 must pass).
