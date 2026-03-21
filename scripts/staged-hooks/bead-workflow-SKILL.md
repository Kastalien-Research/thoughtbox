# Bead Workflow

Every unit of work follows this process. No exceptions. Every transition is enforced by a PreToolUse hook that exits non-zero. You cannot skip steps.

## Steps

### 1. Claim
```
bd update <id> --claim
```
Hook writes `current-bead.json`. You are now on this bead.

### 2. Hypothesize
```
bd update <id> --notes="Hypothesis: <what you expect to change and why>"
```
Hook sets `hypothesis_stated: true`.

**YOU CANNOT EDIT src/ OR supabase/migrations/ UNTIL THIS IS DONE.** The enforcer blocks Edit/Write.

### 3. Implement
Write only the code that tests the hypothesis. Nothing else.

Hook deletes `tests-passed-since-edit` on every Edit/Write to `src/`.

### 4. Test
Run the relevant tests.
```
npx vitest run <relevant test file>
```
Hook creates `tests-passed-since-edit` when vitest passes clean.

If the test **fails**: that is a surprise.
```
bd update <id> --notes="Surprise #1: <what happened>"
```
Update hypothesis. Return to step 3.

If **two consecutive surprises** on the same bead: STOP. The enforcer blocks everything. Run Ulysses REFLECT before continuing.

### 5. Validate
State the result. Did the hypothesis hold?

### 6. Close
```
bd close <id> --reason="<what was validated>"
```
**YOU CANNOT CLOSE IF:**
- Tests haven't passed since last code change
- Multiple bead IDs in one command

Hook writes `pending-validation.json`.

### 7. Pause
**YOU CANNOT START THE NEXT BEAD** until the user confirms.

All Edit/Write/Bash work commands are blocked. Only test/validation commands are allowed.

User clears the gate:
```
touch .claude/state/bead-workflow/validation-confirmed
```

## Ulysses Escalation

Ulysses is NOT the default. It is the circuit breaker.

- Surprise #1: log it, update hypothesis, retry from step 3
- Surprise #2: `reflect-required` sentinel written. Everything blocked.
- Run REFLECT: formulate falsifiable hypothesis + falsification criterion
- After REFLECT: sentinel cleared, surprise count reset, return to step 3

If Ulysses activates frequently, beads are too large or hypotheses are too vague.

## State Files

All in `.claude/state/bead-workflow/` and `.claude/state/ulysses/`.

| File | Created | Cleared | Gates |
|------|---------|---------|-------|
| `current-bead.json` | claim | close | hypothesis check |
| `tests-passed-since-edit` | test pass | code edit | close |
| `pending-validation.json` | close | user confirms | next bead |
| `reflect-required` | 2nd surprise | REFLECT | everything |

## Hooks

| Hook | Event | Action |
|------|-------|--------|
| `bead_workflow_state_writer.sh` | PostToolUse | Writes state files |
| `bead_workflow_enforcer.sh` | PreToolUse | Blocks violations (exit 1) |
| `ulysses_state_writer.sh` | PostToolUse | Counts surprises |
| `ulysses_enforcer.sh` | PreToolUse | Blocks when REFLECT required |

Test hooks before installing: `scripts/staged-hooks/test_hooks.sh`
