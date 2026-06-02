# Surprise-Gated Debugging Protocol

**Version 0.1 — Draft Specification**

---

## 1. Overview

This protocol governs an autonomous agent engaged in a debugging process of
indeterminate length — one where the full sequence of actions required to
resolve the issue cannot be known in advance. The protocol manages agent
behavior through **surprise-gated state transitions**, **pre-committed recovery
planning**, and **falsifiable hypothesis formation**, with the goal of
guaranteeing a non-failure terminal state: either the issue is resolved, or the
agent correctly identifies that it lacks sufficient information or tooling to
resolve it.

---

## 2. Definitions

**Step**: A discrete action the agent takes in the debugging process. Steps are
drawn from an **opportunity space** — the set of all actions the agent considers
available given its current model of the system.

**Checkpoint**: A known-good state to which the agent can return. Checkpoints
are created on success and serve as entropy floors — lower bounds on the agent's
confidence in its world model.

**Surprise**: A divergence between the expected outcome of a step and its actual
outcome. Surprise is assessed comparatively, not absolutely (see §5).

**Hypothesis**: An explanatory model for why one or more surprises occurred.
Hypotheses are provisional and must carry stated falsification criteria (see
§7).

**Session**: A complete run of the protocol from initialization to terminal
state.

---

## 3. State Machine

The agent maintains a **step counter** `S` initialized to `0`. The counter
governs which phase of the protocol the agent is in.

```
S = 0  →  PLAN phase
S = 1  →  RECOVERY phase
S = 2  →  REFLECT phase (mandatory return to S = 0)
```

### 3.1 PLAN Phase (S = 0)

The agent performs the following, in order:

1. **Select the highest-value next step** from the opportunity space. Call this
   `step_primary`. "Highest value" is determined by the agent's estimate of
   expected information gain weighted by probability of advancing toward
   resolution.

2. **Pre-commit a recovery step.** Before executing `step_primary`, the agent
   must specify `step_recovery` — the action it will take if `step_primary`
   produces a surprising outcome. `step_recovery` is generated under the agent's
   _current_ model, before the surprise occurs, ensuring it is not distorted by
   the cognitive load of an unexpected result.

3. **Classify `step_primary` by reversibility** (see §6).

4. **Execute `step_primary`.**

5. **Assess the outcome** (see §4).

### 3.2 RECOVERY Phase (S = 1)

The agent has encountered a Flagrant-1 surprise at S = 0 and now executes
`step_recovery`, which was pre-committed during the PLAN phase.

1. **Execute `step_recovery`.**

2. **Assess the outcome** (see §4).

Note: The agent does NOT pre-commit a further recovery step at this stage. If
`step_recovery` also produces a surprise, the protocol escalates to REFLECT
rather than planning further speculative actions.

### 3.3 REFLECT Phase (S = 2)

Triggered when two consecutive steps have produced surprising outcomes.

1. **Return to the most recent checkpoint.** If the environment has been
   modified by irreversible steps, attempt rollback (see §6).

2. **Form a hypothesis** explaining why both surprises occurred (see §7).

3. **Prune the opportunity space.** Remove the failed `(step, context)` pairs —
   not the steps absolutely, but the steps as conditioned on the state in which
   they were attempted (see §8).

4. **Reset `S = 0`.** Generate new `step_primary` and `step_recovery` from the
   revised opportunity space and updated model.

---

## 4. Outcome Assessment

After every step execution, the agent evaluates whether the outcome matches its
prior expectation. There are three possible assessments:

### 4.1 Expected Outcome

The step produced the result the agent predicted.

- **Action**: Create a checkpoint at the current state. Reset `S = 0`.

### 4.2 Unexpected-Favorable Outcome

The step produced an outcome better than expected.

- **Condition for acceptance**: The agent SHOULD default to rejecting
  unexpected-favorable outcomes unless the surplus is overwhelming and the
  uncertainty increase is minimal. When the agent does choose to evaluate
  acceptance formally, it may retain the favorable outcome ONLY IF the increase
  in total model uncertainty is less than or equal to the estimated surplus
  utility of the outcome.

  Formally: `ΔU_uncertainty ≤ U_surplus`

  where `U_surplus = U_actual - U_expected` and `ΔU_uncertainty` is the agent's
  estimate of how much its confidence in its world model has degraded due to the
  unexpected nature of the result.

  In practice, both values are estimates and the condition is vulnerable to
  calibration noise. The conservative default — reject and treat as §4.3 — is
  always the safer path.

- **If condition met**: Accept the outcome. Create a checkpoint. Reset `S = 0`.

- **If condition not met**: Treat as Unexpected-Unfavorable (§4.3). The gains
  are not worth the model instability they introduce.

- **Rationale**: Unexplained good fortune is still unexplained. An agent that
  accepts windfalls without accounting for the uncertainty they introduce will
  accumulate model debt that compounds into later failures.

### 4.3 Unexpected-Unfavorable Outcome

The step produced a result the agent did not predict and does not want.

- **Classify the surprise by severity** (see §5).

- **If Flagrant 1**: Increment `S`. Proceed to the next phase (RECOVERY if
  coming from PLAN; REFLECT if coming from RECOVERY).

- **If Flagrant 2**: Regardless of the current value of `S`, immediately enter
  REFLECT (§3.3). Do NOT execute any pre-committed recovery step — that step was
  planned under a model that has just been shown to be fundamentally broken.

---

## 5. Surprise Severity Assessment

Surprise severity is assessed **comparatively**, not absolutely. The agent
maintains a **surprise register**: a ranked list of the most surprising outcomes
encountered in the current session, capped at three entries.

### 5.1 Ranking Procedure

When a new surprise occurs:

1. The agent compares it pairwise against each entry in the surprise register,
   answering: "Was this new surprise more or less unexpected than that one?"

2. The new surprise is inserted into the register at its ranked position.

3. If the register exceeds three entries, the least-surprising entry is dropped.

**Bootstrapping rule**: The first surprise in a session has no comparator. It
enters the register as the sole entry and is classified as Flagrant 1 by
default.

### 5.2 Severity Classification

The surprise register feeds into a **two-category step function**:

**Flagrant 1** (routine surprise): The outcome diverged from expectation but is
within the general domain of plausible outcomes given the agent's current model
of the system. The agent proceeds through the normal state machine cadence.

**Flagrant 2** (model-breaking surprise): The outcome is not merely unexpected
but suggests the agent's model of the system is fundamentally incorrect. This
triggers immediate REFLECT regardless of the current step counter.

Classification as Flagrant 2 requires BOTH of the following:

1. The surprise ranks at or near the top of the surprise register.

2. The agent judges that its current working model of the system **cannot
   account for** the observed outcome — not that the outcome was unlikely, but
   that the model provides no mechanism by which it could have occurred.

Condition (2) prevents premature escalation in early sessions where the register
is short and a modest surprise could trivially top a near-empty list.

### 5.3 Reversibility Conditioning

Surprise severity is interpreted in light of the step's reversibility class (see
§6). The same outcome carries different informational weight depending on the
expected risk profile of the action that produced it.

- A surprising outcome from a **reversible step** is _highly informative_. The
  step should not have been able to perturb the system, so the surprise is
  predominantly epistemic signal about the system's actual state.

- A surprising outcome from an **irreversible step** is _less informative in
  isolation_, because the surprise may have been caused by the step's own side
  effects rather than revealing a pre-existing system property.

The agent should weight its Flagrant-1/Flagrant-2 judgment accordingly. In
particular: a surprising outcome from a reversible, low-risk step (e.g., a
read-only operation producing an impossible result, or an innocuous code change
causing a cascade failure) is a strong Flagrant-2 candidate.

---

## 6. Step Reversibility

Each step is classified into one of two reversibility categories before
execution.

### 6.1 Reversible Steps

Read-only operations, easily-undone changes, sandboxed modifications. Examples:
reading logs, inspecting configuration, running tests in isolation, adding
diagnostic output.

No special rollback procedure is required.

### 6.2 Irreversible Steps

State mutations, dependency changes, configuration modifications that affect
other subsystems, writes to shared resources. Examples: modifying database
schemas, updating package versions, altering production configuration, writing
to files consumed by other processes.

**Requirements for irreversible steps**:

- The agent SHOULD prefer reversible steps when both are available at comparable
  expected value.

- Before executing an irreversible step, the agent MUST record enough state
  information to attempt rollback if the step produces a surprising outcome.

- On REFLECT triggered after an irreversible step, rollback MUST be attempted
  before hypothesis formation. Reflecting on a dirty environment produces
  unreliable hypotheses.

### 6.3 Reversibility × Surprise Matrix

|                  | Flagrant 1                                           | Flagrant 2                                                                                                                                        |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reversible**   | Proceed normally. High-quality epistemic signal.     | Immediate REFLECT. Something is deeply wrong with the agent's model.                                                                              |
| **Irreversible** | Proceed normally. Attempt rollback before next step. | Immediate REFLECT. Mandatory rollback attempt. Agent flags that the environment may be in a compromised state affecting all subsequent reasoning. |

---

## 7. Hypothesis Formation

When the agent enters the REFLECT phase, it must form a hypothesis explaining
the pattern of surprises that triggered reflection. Hypotheses are treated as
first-class entities within the protocol — they are provisional, testable, and
subject to the same pruning discipline as steps.

### 7.1 Formation Procedure

The following sequence is mandatory and order-dependent:

1. **State the hypothesis.** The agent articulates an explanatory model for why
   the observed surprises occurred.

2. **State the falsification criteria.** BEFORE generating any steps that follow
   from the hypothesis, the agent must specify what evidence would lead a
   rational observer to abandon it. These criteria must be concrete and
   observable — not "if the hypothesis turns out to be wrong" but "if I observe
   X, Y, or Z, this hypothesis is disconfirmed."

   The ordering constraint prevents the agent from unconsciously tailoring
   falsification criteria to be unlikely given its planned steps (confirmation
   bias).

3. **Generate steps.** Only after (1) and (2) are complete does the agent
   produce the next `step_primary` and `step_recovery` from the revised
   opportunity space, informed by the hypothesis.

### 7.2 Hypothesis Pruning

If a hypothesis leads to further surprises (i.e., the agent enters REFLECT again
while operating under that hypothesis), and the falsification criteria stated in
§7.1.2 are met by the observed evidence, the hypothesis is pruned.

On pruning:

- The agent MUST generate a **structurally different** hypothesis — not a
  variant of the pruned one. "Structurally different" means: the new hypothesis
  must invoke at least one causal mechanism not present in the pruned
  hypothesis.

- The pruned hypothesis is recorded in the session log to prevent recurrence.

### 7.3 Hypothesis Accumulation Limit

If the agent prunes **three consecutive hypotheses** without achieving an
expected outcome, it must evaluate whether it has sufficient information and
tooling to resolve the issue. This is a candidate terminal condition for an
INSUFFICIENT_INFORMATION outcome (see §9).

---

## 8. Opportunity Space Management

### 8.1 Pruning Granularity

Steps are pruned as **(step, context) pairs**, not as absolute entries. A step
that failed in one context (system state, preceding actions, active hypothesis)
may be viable in a different context. The agent records:

- The step that was attempted
- The system state at the time of the attempt (checkpoint reference)
- The active hypothesis, if any
- The outcome that constituted the surprise

This tuple is what gets pruned. The step itself remains available for future
consideration if the context has changed.

### 8.2 Space Exhaustion

If the opportunity space is pruned to the point where the agent cannot generate
a `step_primary` that is not a member of a pruned (step, context) pair in the
current context, this is a candidate terminal condition for
INSUFFICIENT_INFORMATION (see §9).

---

## 9. Terminal States

The protocol recognizes three terminal states:

### 9.1 RESOLVED

The agent has identified and addressed the root cause of the issue. The final
state passes the agent's verification criteria.

### 9.2 INSUFFICIENT_INFORMATION

The agent has determined that it cannot resolve the issue with its current
information and tooling. This terminal state is reached through one or more of:

- Hypothesis accumulation limit exceeded (§7.3)
- Opportunity space exhausted (§8.2)
- Agent explicitly judges, during any REFLECT phase, that the information
  required to form a viable hypothesis is not accessible to it

The agent MUST articulate what specific information or capabilities would be
needed to make further progress. A bare "I can't do this" is not a valid
INSUFFICIENT_INFORMATION outcome.

### 9.3 ENVIRONMENT_COMPROMISED

A special sub-case applicable when an irreversible step has produced a
Flagrant-2 surprise and rollback has failed. The agent cannot trust its own
observations because the environment state is uncertain. The agent reports what
it knows, what it attempted, and why the environment can no longer be relied
upon.

---

## 10. Session Reflection

Upon reaching any terminal state, the agent performs a structured reflection
over the complete session. This reflection is NOT part of the debugging process
itself — it is a post-hoc analysis for the benefit of future sessions and human
reviewers.

### 10.1 Reflection Outputs

1. **Step Graph**: A complete directed graph of all steps taken, with edges
   labeled by outcome assessment (expected / unexpected-favorable /
   unexpected-unfavorable) and surprise classification where applicable.

2. **Surprise Register History**: The evolution of the surprise register over
   the session — what entered, what was displaced, and how the severity
   distribution shifted.

3. **Hypothesis Genealogy**: The sequence of hypotheses formed, their stated
   falsification criteria, whether they were pruned or survived, and — in
   retrospect — which ones were closest to the actual root cause (if RESOLVED)
   or which ones revealed the boundaries of the agent's knowledge (if
   INSUFFICIENT_INFORMATION).

4. **Retrospective Surprise Decomposition**: With full session context, the
   agent reviews each surprise and decomposes it into operational and epistemic
   components. This decomposition is unreliable in real-time (see §1) but
   valuable in retrospect for identifying patterns in the agent's model
   failures.

5. **Transferable Priors**: Any findings that would be useful as calibration
   context for future sessions operating on the same codebase. These are
   recorded as observations, not as binding instructions.

---

## 11. Protocol Invariants

The following properties must hold at all times during a session:

1. **No step is executed without a pre-committed recovery step**, except during
   the RECOVERY phase itself.

2. **No hypothesis is acted upon without stated falsification criteria.**

3. **The step counter `S` never exceeds 2.** At `S = 2`, the agent MUST reflect
   and reset.

4. **Checkpoints are created only on expected or accepted-favorable outcomes.**
   No checkpoint is ever created in a state of unresolved surprise.

5. **The surprise register is never consulted for absolute magnitude.** All
   severity judgments are comparative within the session.

6. **Pruned steps are pruned in context.** No step is globally removed from the
   opportunity space.

7. **Irreversible steps require recorded rollback information before
   execution.**
