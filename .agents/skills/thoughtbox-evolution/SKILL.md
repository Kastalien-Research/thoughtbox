---
name: thoughtbox:evolution
description: A-Mem thought evolution — check which prior thoughts should be updated when a significant new insight arrives. Spawns a lightweight subagent to classify prior thoughts as UPDATE or NO_UPDATE, then applies revisions. Use during long reasoning sessions when you reach a synthesis, make a decision, or discover something that changes earlier assumptions. Triggers on "this changes what I thought earlier", "update prior reasoning", "evolve thoughts", or automatically on conclusion/synthesis thoughts in sessions >10 thoughts.
user-invocable: true
argument-hint: [the new insight that may require updating prior thoughts]
---

# Thought Evolution (A-Mem Pattern)

When you add a new insight to a reasoning session, earlier thoughts don't automatically update. Thought 1 might say "consider rate limiting" while thought 15 decides "use sliding window algorithm" — but thought 1 doesn't know about the sliding window decision. This skill checks which prior thoughts should evolve.

Based on the A-Mem paper (arxiv.org/abs/2502.12110): when new memory is added, find related existing memories and update their context.

## When to Trigger

Run evolution checks when the new thought:
- **Resolves ambiguity** from earlier thoughts
- **Contradicts** an earlier assumption
- **Adds implementation detail** to a high-level earlier thought
- **Synthesizes** multiple earlier threads into a conclusion

Don't run for every thought — only on significant ones (synthesis, conclusions, decisions, revisions).

## Workflow

### Phase 1: Retrieve Session Content

```javascript
// thoughtbox_execute
async () => {
  const session = await tb.session.get("current-session-id");
  return session.thoughts.map((t, i) => ({
    number: t.thoughtNumber,
    content: t.thought.slice(0, 200)  // Truncate for efficiency
  }));
}
```

### Phase 2: Spawn Evolution Checker

Dispatch a Haiku subagent for cost efficiency (~400 tokens in subagent context, ~50 tokens returned):

```
Spawn subagent (model: haiku):
  "Evaluate which prior thoughts should be updated based on a new insight.

   NEW INSIGHT:
   [Your new thought content]

   PRIOR THOUGHTS:
   S1: [thought 1 content]
   S2: [thought 2 content]
   ...

   For each thought, respond ONLY with:
   S1: [UPDATE|NO_UPDATE] - [brief reason if UPDATE]
   S2: [UPDATE|NO_UPDATE] - [brief reason if UPDATE]
   ...

   Be selective. Only suggest UPDATE if the new insight meaningfully enriches
   the prior thought's context. Keyword overlap alone is not enough."
```

### Phase 3: Apply Revisions

For each thought marked UPDATE, create a revision:

```javascript
async () => {
  await tb.thought({
    thought: "EVOLVED: [original content] — Now contextualized: [how new insight relates]",
    thoughtType: "reasoning",
    isRevision: true,
    revisesThought: 1,  // The thought number being updated
    thoughtNumber: 20,  // Current thought number (advances the chain)
    totalThoughts: 25,
    nextThoughtNeeded: true
  });
}
```

### Phase 4: Update Knowledge Graph (If Applicable)

If the new insight creates, invalidates, or modifies a knowledge entity:

```javascript
async () => {
  // Add observation to existing entity
  await tb.knowledge.addObservation({
    entity_id: "entity-uuid",
    content: "Updated understanding: sliding window chosen over fixed buckets (see session XYZ, thought 15)"
  });
}
```

## Evolution Criteria

A thought should be updated if the new insight:

| Criterion | Example |
|-----------|---------|
| Resolves ambiguity | Old: "consider rate limiting" → New: "using sliding window" |
| Adds implementation detail | Old: "need caching" → New: "Redis with 5-min TTL" |
| Contradicts or refines | Old: "JWT approach" → New: "JWTs won't work here" |
| Creates connection | Old: "auth is separate" → New: "auth and rate limiting share session store" |

A thought should NOT be updated if:
- Connection is trivial (just keyword overlap)
- Old thought already implies the new insight
- Old thought is completely unrelated

## Sliding Window Optimization

For long sessions (>30 thoughts), don't check all prior thoughts — check only the last 10-15 or use the most relevant ones:

```javascript
async () => {
  const session = await tb.session.get("session-id");
  // Only check recent thoughts, not the entire history
  const recentThoughts = session.thoughts.slice(-15);
  return recentThoughts;
}
```

## Cost

- Haiku subagent: ~400 tokens per check
- Your context: ~50 tokens (just the UPDATE/NO_UPDATE list)
- Break-even: always cheaper than manual review for sessions >3 thoughts

See `thoughtbox://prompts/evolution-check` for the full pattern reference.
