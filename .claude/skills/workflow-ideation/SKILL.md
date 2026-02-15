---
name: workflow-ideation
description: Evaluate whether an idea is worth implementing by asking structured questions about outcomes, alignment, and opportunity cost. Stage 1 of the development workflow.
argument-hint: [idea description]
user-invocable: true
---

Evaluate whether to proceed with implementing: $ARGUMENTS

## Purpose

You are executing Stage 1 (Ideation) of the development workflow. Your job is to determine whether this idea is worth the engineering investment by asking four structured questions. You do NOT write code, specs, or ADRs — you produce a decision.

## Process

### Step 1: Gather Context

Before asking the questions, gather existing context that might already contain answers:

1. **Check accepted ADRs** for prior decisions in this domain:
   ```bash
   ls .adr/accepted/ 2>/dev/null
   ```
   Read any ADRs that relate to the idea's domain. Note whether their reasoning still holds.

2. **Check compound learnings** for prior experience:
   Search for relevant learnings in knowledge stores, agent memory, and previous reflections.

3. **Check open issues** for related work:
   ```bash
   bd list --status=open
   ```

Present a brief summary of what you found before proceeding to the questions.

### Step 2: Ask the Four Questions

Work through these questions with the user. For each question, present your analysis based on the context gathered, then ask the user to confirm, revise, or expand.

#### Q1: Desired Outcomes
> What outcomes are we striving to achieve by implementing this idea? What outcome is this idea "proposed instrumentation" for achieving?

Present your understanding of what the user hopes to accomplish. Be specific — "improve performance" is not an outcome; "reduce API response time from 2s to 200ms for the /search endpoint" is.

#### Q2: Realistic Outcomes
> What outcomes can we reasonably determine we will ACTUALLY get if we implement this? From reading the code, design docs, and any research: what can we say with 90-95% confidence WILL happen?

This is where you do actual investigation. Read relevant code, check dependencies, look at existing implementations. Present what you can say with high confidence about what will actually happen.

#### Q3: Alignment Check
Compare Q1 answers against Q2 answers, then work through these sub-questions:

**3a. Goal Alignment**: Is the realistic outcome aligned with our goals? If not, the idea is solving the wrong problem.

**3b. Simpler Alternative**: Is there a simpler or existing way to achieve the goal-aligned outcome? Check whether something already exists that does what we need, or whether a configuration change would suffice.

**3c. Revision Impact**: If we proceed, what existing work will need to be edited, revised, or reconsidered? List specific files, specs, ADRs, and systems that would be affected.

**3d. Opportunity Cost**: Considering the revision impact from 3c, is executing this process more valuable than anything else we could be doing with that time?

### Step 3: Decision

If the answer to 3d is a **confident "no"**: Recommend turning attention to whatever IS the most valuable use of time. Record this recommendation in the workflow state.

If the answer is **anything else** (yes, uncertain, qualified yes): Recommend proceeding to Dev-Time Docs (Stage 2).

### Step 4: Record and Handoff

If the user confirms proceeding:

1. **Update workflow state** (`.workflow/state.json`):
   - Set `stages.ideation.status` to `"completed"`
   - Set `stages.ideation.completedAt` to current ISO timestamp
   - Set `stages.ideation.notes` to a 1-2 sentence summary of the decision rationale
   - Set `currentStage` to `"dev-docs"`
   - Update `updatedAt`

2. **Present the handoff**:
   ```
   IDEATION COMPLETE
   =================

   Decision: PROCEED / DO NOT PROCEED
   Rationale: [1-2 sentences]

   Desired outcomes:
   - [bullet list from Q1]

   Realistic outcomes:
   - [bullet list from Q2]

   Revision impact:
   - [files/systems from 3c]

   Next: Stage 2 - Dev-Time Docs (/hdd)
   The conductor will dispatch /hdd to create the spec and ADR.
   ```

If the user decides NOT to proceed:
1. Update workflow state with status `"completed"` and notes explaining why
2. Close the workflow bead with the reason
3. The workflow ends here

## Prior Art Check

When checking accepted ADRs and compound learnings, apply these specific checks:
- Does a prior ADR already address this domain? If so, does its reasoning still hold?
- Was this idea (or something similar) previously rejected? If so, what changed?
- Are there learnings that suggest this approach has been tried and failed?

If prior art exists, present it to the user with the question: "This relates to [prior work]. Has anything changed that makes this worth revisiting?"

## Anti-Patterns

- Do NOT skip straight to "yes, let's build it" — the questions exist to prevent wasted effort
- Do NOT fabricate realistic outcomes (Q2) — investigate the actual code and constraints
- Do NOT treat 3d as rhetorical — genuinely consider what else could be done with the time
- Do NOT write specs or ADRs — that's Stage 2's job
