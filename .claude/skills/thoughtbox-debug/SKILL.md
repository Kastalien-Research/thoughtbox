---
name: thoughtbox:debug
description: Trigger when debugging something unexpected — a test failure, surprising behavior, production incident, or any situation where initial attempts aren't working. Prevents the common agent failure mode of trying random things when stuck. Use when "the first fix didn't work", "this is behaving unexpectedly", "I'm stuck", "why is this happening", or after 2+ failed attempts to fix something.
argument-hint: [problem description]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Edit, Write, mcp__thoughtbox-cloud-run__thoughtbox_execute, mcp__thoughtbox-cloud-run__thoughtbox_search
---

# Thoughtbox Debug

Guided debugging workflow built on the Ulysses surprise-gated protocol.
Prevents reactive debugging spirals by forcing structured hypotheses after repeated surprises.

## Core Mechanic: The S-Register

The S-register (surprise counter) is the discipline mechanism. Each unexpected outcome increments S.
At S=2, stop and form a falsifiable hypothesis before continuing.
This breaks the "try something, doesn't work, try something else" spiral.

## Phase 1: Initialize

Start a debugging session. Define the problem and any constraints.

```javascript
async () => {
  return await tb.ulysses({
    operation: "init",
    problem: "$ARGUMENTS",
    constraints: [
      // Hard limits on what you can change
    ]
  });
}
```

This starts a session with S=0. State the problem precisely — vague problems produce vague debugging.

## Phase 2: Plan-Act-Assess Loop

Repeat this cycle for each investigation step.

### 2a. Plan with a pre-committed recovery action

Before investigating, declare what you will do AND what you will do if it fails.
The recovery action prevents post-hoc rationalization.

```javascript
async () => {
  return await tb.ulysses({
    operation: "plan",
    primary: "Check CI environment variables vs local .env",
    recovery: "If env vars match, check node version differences"
  });
}
```

### 2b. Execute

Run the primary action using whatever tools are needed (Read, Grep, Bash, etc.).
Gather evidence. Do not interpret yet.

### 2c. Assess the outcome

Report whether the result matched your expectation.

```javascript
async () => {
  return await tb.ulysses({
    operation: "outcome",
    assessment: "unexpected",  // or "expected"
    severity: "minor",         // or "major"
    details: "Env vars are identical — rules out config differences"
  });
}
```

- `"unexpected"` increments S. `"expected"` leaves S unchanged.
- Be honest. Calling a surprise "expected" defeats the protocol.

## Phase 3: Forced Reflection (S=2)

When S hits 2, the protocol blocks further plan operations until you reflect.
This is the mechanism that prevents spiraling.

```javascript
async () => {
  return await tb.ulysses({
    operation: "reflect",
    hypothesis: "The CI failure is caused by a timing race — the database isn't ready when tests start",
    falsification: "If adding a 5-second delay before test execution doesn't fix it, this hypothesis is false"
  });
}
```

Requirements for reflect:
- `hypothesis`: a specific, testable explanation (not "something is wrong with X")
- `falsification`: explicit criteria that would prove the hypothesis wrong

Reflection resets S to 0. Continue the Plan-Act-Assess loop with a focused hypothesis to test.

## Phase 4: Resolution

When the bug is found and fixed:

```javascript
async () => {
  return await tb.ulysses({
    operation: "complete",
    terminalState: "resolved",
    summary: "Root cause: async database seeding wasn't awaited in test setup. Fix: added await to beforeAll hook."
  });
}
```

Terminal states:
- `"resolved"` — root cause found and fixed
- `"abandoned"` — not worth further investigation
- `"deferred"` — understood but fix postponed (file an issue)

## Phase 5: Check Status

Query the current protocol state at any point.

```javascript
async () => {
  return await tb.ulysses({ operation: "status" });
}
// Returns: S value, consecutive surprises, hypothesis count, history
```

## When to Use This

**Use Ulysses when:**
- Your first attempt did not work
- The behavior is genuinely surprising
- You have been going in circles
- The problem involves multiple interacting systems
- You catch yourself thinking "let me just try one more thing"

**Skip for:**
- Simple typos or obvious errors
- Well-understood failure modes
- Quick fixes that work on first try

## Key Principle

When debugging feels frustrating — when you want to "just try this one more thing" —
that is exactly when S=2 reflection would help most.
The protocol forces you to stop guessing and start hypothesizing.
