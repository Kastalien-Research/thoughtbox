# Ulysses Protocol: Surprise-Gated Debugging

A debugging discipline that prevents the "try random things" spiral.
Pre-commit to recovery actions before executing plans, and force
reflection when surprises accumulate.

## When to Use

Use after 2+ failed attempts at fixing something. Use when behavior is
genuinely surprising. Use when you catch yourself thinking "let me just
try one more thing."

Skip for obvious errors (typos, missing imports, wrong variable names).
Skip for well-understood failures where you know the root cause. The
protocol adds overhead -- deploy it when you need the discipline, not
on every bug.

## The S-Register

The surprise counter starts at 0. Each unexpected outcome increments S.

| S value | Effect |
|---------|--------|
| 0 | Normal operation. Plan and execute freely. |
| 1 | Caution. Plans still allowed, but pay attention. |
| 2+ | **Blocked.** No new plans until you `reflect`. |

At S=2, the protocol forces you to stop executing and start thinking.
This is the mechanism that breaks the spiral. You cannot plan your way
out -- you must form a falsifiable hypothesis first.

## Workflow

### Init

Start a Ulysses session when you recognize the pattern.

```javascript
async () => tb.ulysses({
  operation: "init",
  problem: "Tests pass locally but fail in CI",
  constraints: [
    "Cannot modify CI config without approval"
  ]
})
```

This creates the session, sets S=0, and records the problem statement.

### Plan

Every plan requires a pre-committed recovery action. Decide what you
will do if this plan fails *before* you execute it. This prevents
post-hoc rationalization.

```javascript
async () => tb.ulysses({
  operation: "plan",
  primary: "Compare CI env vars to local .env",
  recovery: "If env vars match, check node version differences"
})
```

The recovery field is not optional. If you cannot articulate what you
will do when the plan fails, you do not understand the problem well
enough to act.

### Outcome

Record what happened. Be honest about whether it matched expectations.

```javascript
async () => tb.ulysses({
  operation: "outcome",
  assessment: "unexpected",
  severity: "minor",
  details: "Environment variables are identical -- " +
    "rules out config differences"
})
```

Assessments: `expected` (S unchanged) or `unexpected` (S increments).
Severity: `minor` (surprising but not disorienting) or `major`
(fundamentally challenges your mental model).

### Reflect

Required when S reaches 2. Blocked from planning until you do this.

Form a falsifiable hypothesis. State exactly what would prove it wrong.

```javascript
async () => tb.ulysses({
  operation: "reflect",
  hypothesis: "CI failure is a timing race -- " +
    "database not ready when tests start",
  falsification: "If adding a 5-second delay before tests " +
    "doesn't fix it, this hypothesis is false"
})
```

Reflection resets S to 0, but only if the hypothesis is falsifiable.
"Something is wrong with CI" is not a hypothesis. "The database
container takes longer to start in CI than locally" is.

### Complete

End the session with a terminal state.

```javascript
async () => tb.ulysses({
  operation: "complete",
  terminalState: "resolved",
  summary: "Root cause: async database seeding not awaited " +
    "in test setup"
})
```

### Status

Check current session state at any point.

```javascript
async () => tb.ulysses({ operation: "status" })
```

Returns the S-register value, active plan, and session history.

## Worked Example

**Problem:** Tests pass locally but fail in CI.

### 1. Init (S=0)

Start the session. State the problem and constraints.

```
init -> S=0, problem registered
```

### 2. Plan: check env vars (S=0)

Primary: compare CI env vars to local `.env`.
Recovery: if they match, check node version differences.

### 3. Outcome: unexpected (S=1)

Environment variables are identical. This rules out the most common
cause of local/CI divergence. S increments to 1.

### 4. Plan: check node version (S=1)

Primary: compare `node --version` in CI logs vs local.
Recovery: if versions match, check test execution order.

The pre-committed recovery was set in step 2. Execute it now.

### 5. Outcome: unexpected (S=2)

Node versions are identical. Two surprises in a row. S increments to 2.

**Planning is now blocked.** You cannot execute another plan until you
reflect.

### 6. Reflect (S=0)

Stop. Think. What do the two surprises have in common? Both ruled out
static configuration differences. The problem is dynamic -- something
that changes at runtime.

Hypothesis: CI failure is a timing race. The database container takes
longer to initialize in CI, and tests start before seeding completes.

Falsification: adding a 5-second delay before the test suite runs. If
tests still fail with the delay, the hypothesis is false.

S resets to 0.

### 7. Plan: add delay (S=0)

Primary: add `await sleep(5000)` before test suite in CI.
Recovery: if tests still fail, check database logs for connection
errors during the test window.

### 8. Outcome: expected (S=0)

Tests pass with the delay. Hypothesis confirmed. S stays at 0.

Now fix the root cause: the test setup calls `seedDatabase()` without
`await`. Add the await, remove the delay, confirm tests still pass.

### 9. Complete: resolved

Root cause: async database seeding not awaited in test setup. The
local database was fast enough to finish before tests started; CI's
database was not.

## Terminal States

### resolved

Root cause found and fixed. The preferred outcome. Record the root
cause clearly -- future sessions can search for it.

### abandoned

Not worth investigating further. Use when the cost of continued
debugging exceeds the value of the fix. Record why you stopped so
the next person does not repeat the same investigation.

### deferred

Understood but fix postponed. You know the root cause but cannot or
should not fix it now. File an issue with the hypothesis and evidence
collected during the session. Do not leave deferred work untracked.
