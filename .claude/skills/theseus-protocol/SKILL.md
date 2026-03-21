---
name: theseus-protocol
description: A friction-gated, boundary-constrained refactoring protocol for autonomous agents. Uses adversarial prompt evaluation (Cassandra Audit), strict interface locks (Epistemic Visas), and Thoughtbox-backed persistence to prevent the "Refactoring Fugue State".
argument-hint: <init|checkpoint|visa|outcome|status> [args]
user-invocable: true
allowed-tools: Bash, Read, Glob, Grep, Write, mcp__thoughtbox__thoughtbox_gateway
---

# The Theseus Protocol

A structured framework for autonomous refactoring. While debugging (Ulysses Protocol) is convergent—bounded by verifiable ignorance—refactoring is inherently divergent. Without friction, autoregressive agents will succumb to ontological sprawl ("Refactoring Fugue State").

This protocol uses bureaucratic friction, adversarial auditing, and strict boundary locking to mechanically prevent scope drift and enforce atomic, value-additive changes.

**Core Philosophy**: You cannot ask an agent if its refactor improved the code (Maker's Bias). Value must be mathematically defined as that which survives adversarial critique.

## Persistent Environment via Thoughtbox

Theseus integrates heavily with **Thoughtbox** (Supabase backend) to persist epistemic telemetry. Over time, recording the agent's structural choices, rejected checkpoints, and visa applications allows meta-agents to analyze tendencies and physically alter the repository's ruleset to make good outcomes more likely.

---

## The Workflow & Mechanisms

### 1. `init` — Scope Declaration and The Test Lock

1. Initialize local state (e.g., `B=0`) and declare the files in scope.
2. Start a Thoughtbox session for the refactoring trace:
   ```json
   thoughtbox_gateway { "operation": "start_new", "args": { "task": "theseus-refactor", "aspect": "protocol-session" } }
   ```
3. **The Test-Suite Write Lock**: Writing to `/tests/` or equivalent verification directories is cryptographically disabled. A true refactor changes structure without altering behavior. Modifying tests means altering behavior.

### 2. `visa` — The Epistemic Visa (Handling B > 0)

If the agent attempts to write to a file *outside* the declared scope, the action is blocked (`VisaRequiredException`).
1. The agent must drop into Thoughtbox and submit an *Epistemic Visa*:
   ```json
   thoughtbox_gateway { "operation": "thought", "args": {
     "thoughtType": "visa_application",
     "justification": "Compiler failure forced modification in Module B due to signature change in Module A.",
     "promised_modifications": ["Line 42 ONLY"],
     "anti_pattern_ignorance": true
   }}
   ```
2. Filing this visa introduces computational friction. The agent natively optimizes to avoid it, eliminating casual "Boy Scout" scope creep and forcing it to follow only necessary dependencies.

### 3. `checkpoint` — The Cassandra Audit & Syntactic Tollbooth

When the agent reaches a stable, tested state (`B=0`) and attempts a commit:

1. **Syntactic Tollbooth**: The agent proposes a commit narrative. A regex hook denies the commit if it detects compound actions (e.g., words like "and", "also", "plus", or multiple verbs). Commits must be ruthlessly atomic.
2. **The Cassandra Audit**: The diff is submitted to Thoughtbox and evaluated by an adversarial, zero-context LLM (Cassandra).
   ```json
   thoughtbox_gateway { "operation": "thought", "args": {
     "thoughtType": "cassandra_audit",
     "diff": "<git diff --stat>",
     "target": "--reject-if-premature-abstraction --reject-if-moving-furniture"
   }}
   ```
3. The checkpoint only saves if the primary agent successfully proves concrete structural yield (e.g., complexity reduction, interface decoupling) against Cassandra's critique.

### 4. `outcome` — Red-Green Timer & Hard Reversibility

If the agent makes a modification and breaks the compile/test step:
1. It has exactly **one attempt** to repair the damage.
2. If it fails the repair attempt, the environment enforces a ruthless `git reset --hard` to the last `B=0` checkpoint.
3. This eliminates "shadow state" (where an agent hallucinates a fix 10 steps down the road while sitting in a broken environment).

---

## Commands

Parse the first word of `$ARGUMENTS` to determine the command (implemented in `scripts/theseus.sh`):

*   **`init <scope>`**: Lock tests, declare initial scope, start Thoughtbox session.
*   **`visa <file> <reason>`**: Apply for out-of-bounds file modification.
*   **`checkpoint <atomic-narrative>`**: Trigger the syntactic and Cassandra audits.
*   **`outcome <compile-status>`**: Record test pass/fail. Triggers hard reset if 2 consecutive fails.
*   **`status`**: Show current Boundary (B) state, active visas, and Cassandra audit history.

## Candidate Hooks

| Event | Hook | Rule Enforced |
|-------|------|---------------|
| `PreToolUse:Write` | **Scope Lock**: Reject edit if target file is not in declared scope and lacks an approved Visa. | Drift prevention. |
| `PreToolUse:Write` | **Test Lock**: Reject edit if target file is a test file. | Invariant behavior. |
| `PostToolUse:Bash (tests)` | **Red-Green Timer**: If failure count = 2, run `git reset --hard` and reset to last `B=0`. | Zero tolerance for shadow state. |
| `git commit` | **The Tollbooth**: Reject if message contains "and" or fails Cassandra audit. | Reversibility and Value guarantees. |

## Terminal States
- **REFACTOR COMPLETE**: Checkpoint committed. Tests pass. Thoughtbox session archived for meta-agent trend analysis.
- **AUDIT FAILURE**: Cassandra repeatedly rejects diffs as "Moving Furniture" -> Protocol terminates.
- **SCOPE EXHAUSTION**: Visa applications rejected -> Protocol rolls back and splits the refactor task.
