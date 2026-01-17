# Experiment Design: A-Mem Retroactive Linking

**Paper**: A-Mem: Agentic Memory for LLM Agents (arxiv.org/abs/2502.12110)
**Date**: 2026-01-16

---

## Mechanism Being Tested

**One sentence**: When a new thought is added, find related existing thoughts and have the LLM update their contextual descriptions to incorporate the new insight.

This tests whether **memory can learn from memory** - existing thoughts becoming richer as new related thoughts arrive, rather than remaining static snapshots.

---

## Hypothesis

**If** we retroactively update related thoughts' context when new thoughts are added,
**Then** subsequent retrieval will return more relevant and contextually rich results,
**Because** the accumulated context captures relationships that weren't explicit in the original thought.

---

## Baseline Condition

### Setup
1. Create a Thoughtbox session with 5-7 thoughts on a topic (e.g., "debugging a memory leak")
2. Add a new thought that contains an insight related to earlier thoughts
3. Query for thoughts related to the new insight

### Measurement
- Retrieve top-3 thoughts related to a query
- Score relevance (1-5) of each retrieved thought to the query
- Note: retrieved thoughts have their ORIGINAL context only

### Expected Result
- Retrieval based on surface-level keyword/embedding match
- Earlier thoughts lack context about how they connect to later insights

---

## Test Condition

### Setup
1. Same initial session with 5-7 thoughts
2. When adding the new thought:
   a. Retrieve top-3 most similar existing thoughts
   b. For each, prompt LLM: "Given this new thought: [NEW], should this existing thought's context be updated? If so, provide the enriched context."
   c. Store updated context alongside original content
3. Query for thoughts related to the new insight

### Implementation Sketch

```typescript
async function addThoughtWithEvolution(
  session: Session,
  newThought: ThoughtInput
): Promise<Thought> {
  // 1. Add the thought normally
  const thought = await session.addThought(newThought);

  // 2. Find related existing thoughts
  const related = await session.searchThoughts({
    query: newThought.content,
    limit: 3,
    exclude: [thought.id]
  });

  // 3. For each related thought, check if context should evolve
  for (const existing of related) {
    const evolution = await llm.complete({
      prompt: `
        A new thought was just added to a reasoning session:
        NEW THOUGHT: ${newThought.content}

        Here's an existing related thought:
        EXISTING: ${existing.content}
        CURRENT CONTEXT: ${existing.context || "None"}

        Should the existing thought's context be updated to reflect
        its relationship to the new insight?

        If yes, provide the enriched context (1-2 sentences).
        If no, respond with "NO_UPDATE".
      `
    });

    if (evolution !== "NO_UPDATE") {
      await session.updateThoughtContext(existing.id, evolution);
    }
  }

  return thought;
}
```

### Measurement
- Same retrieval query as baseline
- Score relevance (1-5) of each retrieved thought
- Note: retrieved thoughts now have EVOLVED context

---

## Prediction

| Metric | Baseline | Test | Expected Δ |
|--------|----------|------|------------|
| Avg relevance score (1-5) | ~2.5 | ~3.5 | +1.0 |
| Thoughts with useful context | 1/3 | 3/3 | +2 |
| "Aha" connections surfaced | 0-1 | 2-3 | +2 |

**Falsification**: If evolved context doesn't improve retrieval relevance, or if LLM updates are mostly "NO_UPDATE", the mechanism doesn't help.

---

## Confounds to Control

1. **Query phrasing**: Use identical queries for both conditions
2. **LLM variance**: Run same queries multiple times, average scores
3. **Thought content**: Use same initial thoughts for both conditions
4. **Evaluator bias**: Blind evaluation (don't know which condition)

---

## Token Cost Analysis

**Per new thought added**:
- Retrieve related: ~100 tokens (embedding lookup, minimal)
- Evolution check per related thought: ~300 tokens × 3 = ~900 tokens
- **Total overhead**: ~1000 tokens per thought added

**Trade-off**: ~1000 extra tokens per thought for potentially much better retrieval. Worth it if retrieval quality matters more than insertion speed.

---

## Quick Test Protocol (30 min)

1. Create test session manually with 5 thoughts about "API rate limiting"
2. Add 6th thought: "The rate limiter should use a sliding window, not fixed buckets"
3. **Baseline**: Search "sliding window" - note what comes back
4. **Test**: Manually run evolution prompts on top-3 related thoughts
5. Search "sliding window" again - compare results

---

## Success Criteria

- [ ] At least 2/3 related thoughts get meaningful context updates
- [ ] Retrieval relevance improves by ≥1 point on average
- [ ] Evolution updates capture non-obvious connections
- [ ] Token overhead is acceptable (<2000 per thought)

---

## Next Steps if Successful

1. Implement as optional flag: `thoughtbox.thought({ content, evolve: true })`
2. Test on longer sessions (20+ thoughts)
3. Measure impact on multi-hop reasoning tasks
4. Consider async/background evolution to reduce latency
