# Experiment Design: MemInsight Attribute Mining

**Paper**: MemInsight: Autonomous Memory Augmentation for LLM Agents (arxiv.org/abs/2503.21760)
**Date**: 2026-01-16

---

## Mechanism Being Tested

**One sentence**: Generate structured attributes for each thought along multiple axes (perspective, granularity), then use attribute matching to filter retrieval before embedding search.

This tests whether **semantic attributes improve retrieval precision** - getting fewer but more relevant results by pre-filtering on task-relevant dimensions.

---

## Hypothesis

**If** we mine attributes for thoughts and filter by attribute match before embedding search,
**Then** retrieval will return fewer but more relevant results,
**Because** attributes capture task-relevant dimensions that embeddings may miss.

---

## Baseline Condition

### Setup
1. Create a Thoughtbox session with 10+ thoughts (mixed topics within a project)
2. Perform standard embedding-based retrieval for a specific query
3. Return top-5 results

### Measurement
- Precision@5: What fraction of returned thoughts are actually relevant?
- Recall: Did we miss any highly relevant thoughts?
- Token count: Total tokens in retrieved context

### Expected Result
- Some irrelevant thoughts in top-5 (low precision)
- Relevant thoughts may be ranked lower due to surface similarity issues

---

## Test Condition

### Setup
1. Same session with 10+ thoughts
2. For each thought, generate attributes:
   - **Entity-centric**: What concepts/entities does this discuss?
   - **Conversation-centric**: What intent/goal does this serve?
   - **Priority ranking**: Which attributes are most important?
3. For query, also generate attributes
4. Filter thoughts by attribute overlap, THEN do embedding search on filtered set

### Implementation Sketch

```typescript
interface ThoughtAttributes {
  entities: string[];        // ["rate limiter", "API", "Redis"]
  intent: string;            // "debugging" | "design" | "implementation" | "analysis"
  topic: string;             // "performance" | "security" | "architecture"
  priority: string[];        // Ranked list of most important attributes
}

async function mineAttributes(thought: Thought): Promise<ThoughtAttributes> {
  const response = await llm.complete({
    prompt: `
      Analyze this thought and extract structured attributes:

      THOUGHT: ${thought.content}

      Extract:
      1. ENTITIES: Key concepts, tools, or components mentioned (list 3-5)
      2. INTENT: Primary purpose (one of: debugging, design, implementation, analysis, planning, reflection)
      3. TOPIC: Main domain (one of: performance, security, architecture, data, testing, deployment)
      4. PRIORITY: Rank the above from most to least important for retrieval

      Output as JSON.
    `
  });
  return JSON.parse(response);
}

async function attributeFilteredSearch(
  session: Session,
  query: string,
  limit: number = 5
): Promise<Thought[]> {
  // 1. Mine attributes for the query
  const queryAttrs = await mineAttributes({ content: query });

  // 2. Get all thoughts with their attributes
  const allThoughts = await session.getAllThoughts();

  // 3. Filter by attribute overlap
  const filtered = allThoughts.filter(t => {
    const attrs = t.attributes;
    const entityOverlap = attrs.entities.some(e =>
      queryAttrs.entities.includes(e)
    );
    const intentMatch = attrs.intent === queryAttrs.intent;
    const topicMatch = attrs.topic === queryAttrs.topic;

    // Require at least 2 of 3 matches
    return [entityOverlap, intentMatch, topicMatch]
      .filter(Boolean).length >= 2;
  });

  // 4. Embedding search on filtered set only
  return embeddingSearch(filtered, query, limit);
}
```

### Measurement
- Precision@5: What fraction relevant? (expect higher)
- Recall: Did filtering remove relevant thoughts? (risk)
- Token count: Total tokens in retrieved context (expect lower)
- Filter ratio: How many thoughts filtered out?

---

## Prediction

| Metric | Baseline | Test | Expected Δ |
|--------|----------|------|------------|
| Precision@5 | ~60% | ~85% | +25% |
| Recall | 100% (by definition) | ~90% | -10% |
| Tokens retrieved | ~2000 | ~1200 | -40% |
| Filter ratio | 0% | 50-70% | N/A |

**Key trade-off**: We sacrifice some recall for much better precision. Acceptable if most filtered thoughts were truly irrelevant.

**Falsification**: If precision doesn't improve, or if we filter out too many relevant thoughts (recall < 80%), the mechanism doesn't help.

---

## Confounds to Control

1. **Attribute quality**: LLM must generate consistent attributes
2. **Filter threshold**: "2 of 3 matches" is arbitrary - test different thresholds
3. **Query complexity**: Test on both simple and complex queries
4. **Session diversity**: Test on sessions with varied vs. focused content

---

## Token Cost Analysis

**One-time per thought**:
- Attribute mining: ~200 tokens per thought
- Store attributes alongside thought (negligible storage)

**Per query**:
- Mine query attributes: ~200 tokens
- Filter check: negligible (string matching)
- Embedding search on smaller set: potentially faster

**Break-even**: If session has >20 thoughts and you query multiple times, attribute mining pays off through faster/cheaper retrieval.

---

## Quick Test Protocol (45 min)

1. Create session with 10 thoughts spanning 3 topics:
   - 4 about "API design"
   - 3 about "database optimization"
   - 3 about "error handling"

2. Query: "How should we handle rate limit errors in the API?"
   - **Baseline**: Standard embedding search, note top-5
   - **Test**: Mine attributes for all thoughts + query, filter, then search

3. Compare:
   - Which thoughts returned?
   - How many were truly relevant?
   - Did we miss anything important?

---

## Variations to Test

### A. Priority Ranking Effect
- Mine attributes WITH priority ranking vs WITHOUT
- Paper claims 35% improvement from priority alone

### B. Refined vs Comprehensive Retrieval
- **Comprehensive**: Return all matching thoughts with full attributes
- **Refined**: Filter strictly, return only high-confidence matches

### C. Attribute Axis Ablation
- Test each axis alone: entities only, intent only, topic only
- Find which contributes most to precision improvement

---

## Success Criteria

- [ ] Precision@5 improves by ≥20%
- [ ] Recall stays above 80%
- [ ] Attribute mining is consistent (same thought → similar attributes)
- [ ] Token reduction of ≥30% in retrieved context

---

## Next Steps if Successful

1. Add attribute mining to thought storage (compute on insert)
2. Implement `session.search({ query, useAttributes: true })`
3. Test on real agent workflows (not just synthetic sessions)
4. Consider caching attributes to avoid recomputation
5. Explore: Can attributes improve the CoAT association mechanism?
