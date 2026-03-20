# Bead Workflow Spec

Status: ACTIVE
Author: Human + Claude
Date: 2026-03-20

## Purpose

Every unit of work in this project follows this process. No exceptions.
The process exists because agents will skip steps if not forced.
Every transition is enforced by a PreToolUse hook that exits non-zero.

## The Baseline (every bead, every time)

### Step 1: Claim

```
bd update <id> --claim
```

State written: `current-bead.json` with `hypothesis_stated: false`, `surprise_count: 0`

### Step 2: Hypothesize

```
bd update <id> --notes="Hypothesis: <what you expect to change and why>"
```

State written: `hypothesis_stated: true` in `current-bead.json`

**Enforced:** Edit/Write to `src/` or `supabase/migrations/` is BLOCKED until hypothesis is recorded.

### Step 3: Implement

Write the code. Only the code that tests the hypothesis. Nothing else.

State written: `tests-passed-since-edit` sentinel is DELETED on every Edit/Write to `src/`.

### Step 4: Test

Run the relevant tests. Not the full suite. The ones that prove or disprove the hypothesis.

State written: `tests-passed-since-edit` sentinel is CREATED when vitest passes clean.

If the test fails: that is **Surprise #1**. Go to [Escalation](#escalation).

### Step 5: Validate

State the result out loud. Did the hypothesis hold? Did something unexpected happen?

This is not a formality. This is where you catch yourself before closing a bead
that you didn't actually verify.

If validation reveals a problem: that is a **Surprise**. Go to [Escalation](#escalation).

### Step 6: Close

```
bd close <id> --reason="<what was validated>"
```

**Enforced:** `bd close` is BLOCKED if:
- Tests have not passed since last code change (`tests-passed-since-edit` missing)
- Multiple bead IDs in one command (batch close)

State written: `pending-validation.json` with `validated: false`

### Step 7: Pause

Wait for user go-ahead before starting the next bead.

**Enforced:** All Edit/Write/Bash work commands are BLOCKED while `pending-validation.json` exists.

Allowed while blocked: Read, Grep, Glob, test commands, `bd` commands, `git status`.

Cleared by: `touch .claude/state/ulysses-enforcement/validation-confirmed`

Only the user triggers this. The agent does not clear its own validation gate.

## Escalation: Ulysses REFLECT

Ulysses is NOT the default mode. It is the circuit breaker.

### When it activates

A **surprise** is any unexpected outcome during steps 4 or 5:
- Test failure
- Command failure (non-zero exit on implementation commands)
- Validation reveals the hypothesis was wrong

On surprise #1:
- Log it on the bead (`bd update <id> --notes="Surprise #1: <what happened>"`)
- Update the hypothesis
- Return to Step 3

On surprise #2 (consecutive, same bead):
- `reflect-required` sentinel is written
- ALL tool calls are BLOCKED except: Read, Grep, Glob, `bd show`, `bd update --notes`, and REFLECT itself

### What REFLECT requires

1. Formulate a **falsifiable hypothesis** about why you're stuck
2. State a **falsification criterion** — what evidence would disprove the hypothesis
3. Invoke the Ulysses REFLECT operation

After REFLECT completes:
- `reflect-required` sentinel is removed
- `surprise_count` resets to 0
- Return to Step 3 with the new hypothesis

### When Ulysses should NOT activate

Most beads complete in one pass through steps 1-7.
If Ulysses is activating frequently, the problem is upstream:
- Beads are scoped too large
- Hypotheses are too vague
- The agent is guessing instead of reading

## State Files

All state lives in `.claude/state/ulysses-enforcement/`.

| File | Created by | Cleared by | Purpose |
|------|-----------|------------|---------|
| `current-bead.json` | Step 1 (claim) | Step 6 (close) | Tracks active bead, hypothesis flag, surprise count |
| `tests-passed-since-edit` | Step 4 (test pass) | Step 3 (any code edit) | Gates Step 6 |
| `pending-validation.json` | Step 6 (close) | Step 7 (user confirms) | Gates next bead |
| `reflect-required` | Surprise #2 | REFLECT completion | Gates everything |

## Enforcement Map

| Transition | Hook | Mechanism |
|-----------|------|-----------|
| 1 to 2 | state writer | Writes `current-bead.json` |
| 2 to 3 | **enforcer** | Blocks Edit/Write without hypothesis |
| 3 to 4 | state writer | Clears test sentinel on edit |
| 4 to 5 | state writer | Sets test sentinel on pass; increments surprise on fail |
| 5 to 6 | **enforcer** | Blocks close without test pass |
| 6 to 7 | state writer + **enforcer** | Writes pending-validation; blocks new work |
| 7 to 1 | **enforcer** | Blocks until user confirms |
| surprise #2 | state writer + **enforcer** | Writes reflect-required; blocks everything |
| REFLECT to 3 | state writer | Clears sentinel and surprise count |

## Implementation

- **State writer:** `.claude/hooks/ulysses_state_writer.sh` (PostToolUse, exit 0 always)
- **Enforcer:** `.claude/hooks/ulysses_enforcer.sh` (PreToolUse, exit 1 to block)
- **Settings:** `.claude/settings.json` — both hooks wired in

## Non-negotiable

1. Every transition is enforced by a hook. Not a reminder. Not a prompt. A hook that exits non-zero.
2. The agent cannot clear its own validation gate.
3. Batch closes are blocked. One bead, one validation, one close.
4. If the hooks aren't firing, work stops until they are fixed.
