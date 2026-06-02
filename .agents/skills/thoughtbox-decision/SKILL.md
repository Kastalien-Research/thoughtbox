---
name: thoughtbox:decision
description: >
  Structure decisions with parallel hypothesis exploration and knowledge graph
  persistence. Triggers on: "decide", "choose between", "which approach",
  "compare options", "evaluate alternatives", "tradeoff analysis".
argument-hint: [decision to make or options to evaluate]
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, ToolSearch
---

Use Thoughtbox branching to evaluate: $ARGUMENTS

## Phase 1: Frame the Decision

1. Create a session titled `Decision: [topic]`.
2. Record thought 1: state the decision clearly.
   - What are we choosing between?
   - What constraints apply?
   - What does success look like?
3. Identify 2-4 distinct options (if not already provided by the user).

## Phase 2: Branch and Explore

For each option, create a branch from thought 1 using `branchFromThought`
and `branchId`. Within each branch, gather evidence, assess pros/cons,
and identify risks using `reasoning` thoughts.

```javascript
async () => {
  await tb.thought({
    thought: "Option A: PostgreSQL — ACID compliance, mature ecosystem, strong JSON support via jsonb",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 2,
    totalThoughts: 15,
    branchFromThought: 1,
    branchId: "postgresql"
  });
}
```

Each branch should contain at minimum:
- **Evidence**: concrete facts supporting or undermining the option
- **Pros/cons**: structured assessment against the stated constraints
- **Risks**: what could go wrong, how recoverable is it
- **Dependencies**: what else changes if we pick this option

Use external tools (Grep, Read, web search) to gather real evidence
rather than reasoning from memory alone.

## Phase 3: Cross-Verify

Compare branches pairwise:
1. Where do options **agree**? (shared strengths indicate low-risk ground)
2. Where do they **contradict**? (genuine tradeoffs to weigh)
3. Which criteria does each option **win** on?
4. Are any options **strictly dominated**? (worse on every axis — eliminate)

Record cross-verification as a `reasoning` thought on the main trunk
(no `branchId`), referencing the branch thoughts by number.

See `thoughtbox://guidance/parallel-verification` for the parallel
exploration pattern.

## Phase 4: Converge

Record a `decision_frame` thought with confidence and options. Exactly
one option must be `selected: true`.

```javascript
async () => {
  await tb.thought({
    thought: "PostgreSQL wins: ACID required for financial data, jsonb handles semi-structured needs, team has existing expertise",
    thoughtType: "decision_frame",
    confidence: "high",
    options: [
      { label: "PostgreSQL", selected: true, reason: "ACID + jsonb + team expertise" },
      { label: "MongoDB", selected: false, reason: "Better schema flexibility but ACID trade-off unacceptable" },
      { label: "DynamoDB", selected: false, reason: "Vendor lock-in, team unfamiliar" }
    ],
    nextThoughtNeeded: false,
    thoughtNumber: 15,
    totalThoughts: 15
  });
}
```

State the rationale in one clear sentence. If confidence is `low` or
`medium`, explain what additional information would raise it.

## Phase 5: Persist

1. Create a knowledge entity for the decision:
   ```javascript
   async () => {
     await tb.knowledgeGraph({
       operation: "create_entities",
       entities: [{
         name: "Decision: [topic]",
         entityType: "Insight",
         observations: [
           "Chose [option] because [rationale]",
           "Rejected [option] because [reason]",
           "Key constraint: [constraint that drove the decision]"
         ]
       }]
     });
   }
   ```
2. Create relations to relevant existing entities (components, services,
   specs) that the decision affects.
3. Add an observation with the full rationale so future sessions can
   recover the reasoning without replaying the branch exploration.

## When to Bridge to an ADR

If the decision is **architectural** — meaning it constrains future
implementation choices, crosses module boundaries, or is expensive to
reverse — bridge to a formal Architecture Decision Record:

1. Run the `hdd` skill to stage an ADR in `.adr/staging/`.
2. Reference the Thoughtbox session ID in the ADR's context section.
3. The decision_frame thought becomes the ADR's decision; the branch
   exploration becomes the ADR's considered alternatives.

Non-architectural decisions (library choice within a module, naming
conventions, test strategy for a single feature) stay in the knowledge
graph without an ADR.
