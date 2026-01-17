# RLM-Inspired Architecture: Server-Side Computation

> Solving the MCP context pollution problem through recursive server-side processing

## Source

Inspired by: [Recursive Language Models](https://arxiv.org/abs/2512.24601) (Zhang, Kraska, Khattab - MIT CSAIL, Oct 2025)

## The Core Problem

**MCP tool responses appear in the conversation context.**

This means:
```
User: "What did we conclude about authentication?"
Agent: [calls thoughtbox.session with query]
Server: [returns 50 thoughts, 8000 tokens]
       ↓
Those 8000 tokens are now IN THE CONVERSATION
```

The "external memory" advantage is **partially illusory**. You pay the context cost every time you retrieve. Thoughtbox stores thoughts externally, but retrieval = context consumption.

The cipher compresses thought *content* (2-4x reduction), but doesn't address the architectural issue that **every retrieval pollutes the main context**.

## RLM's Key Insight

RLM treats context as an **external environment** that the model interacts with through a REPL. Crucially:

1. The model can **peek, grep, partition, map** over context
2. Recursive sub-calls happen in **isolated environments**
3. Only **final results** return to the main conversation
4. The full context **never appears** in the primary context window

**Result**: 10M+ token contexts handled efficiently, with cheaper cost than processing directly.

## Application to Thoughtbox

### Current Architecture (Context-Polluting)

```
┌─────────────────────────────────────────────┐
│ Conversation Context                        │
│                                             │
│  User: "Summarize our auth discussion"      │
│  Agent: [tool_call: session.list_thoughts]  │
│  Server: [50 thoughts, 8000 tokens] ←───────┼── ALL of this is in context now
│  Agent: "Based on the thoughts above..."    │
│                                             │
└─────────────────────────────────────────────┘
```

### Proposed Architecture (Server-Side Computation)

```
┌─────────────────────────────────────────────┐
│ Conversation Context                        │
│                                             │
│  User: "Summarize our auth discussion"      │
│  Agent: [tool_call: session.query           │
│          {query: "auth conclusions",        │
│           operation: "summarize"}]          │
│  Server: [200 token summary] ←──────────────┼── Only summary in context
│  Agent: "The key conclusions were..."       │
│                                             │
└─────────────────────────────────────────────┘

                    ┌─────────────────────────┐
                    │ Server-Side (invisible) │
                    │                         │
                    │ 1. Load 50 thoughts     │
                    │ 2. Filter by "auth"     │
                    │ 3. Call sub-LLM to      │
                    │    summarize            │
                    │ 4. Return only summary  │
                    └─────────────────────────┘
```

## Proposed New Tools/Operations

### 1. `thoughtbox.query` - Server-Side Query Execution

Instead of returning raw thoughts, execute queries server-side:

```typescript
// Request
{
  tool: "thoughtbox",
  operation: "query",
  params: {
    filter: "type:conclusion AND topic:auth",
    operation: "summarize" | "count" | "list_ids" | "extract",
    prompt: "What were the key decisions?",  // For LLM operations
    max_response_tokens: 500
  }
}

// Response - ONLY the computed result
{
  result: "Key auth decisions: 1) JWT over sessions, 2) Redis for token storage...",
  metadata: { thoughts_processed: 47, computation_cost: "0.02" }
}
```

### 2. `thoughtbox.peek` - Minimal Context Retrieval

Return only IDs and one-line summaries, never full content:

```typescript
// Request
{
  tool: "thoughtbox",
  operation: "peek",
  params: { filter: "recent:10" }
}

// Response - minimal footprint
{
  thoughts: [
    { id: "t_001", type: "H", summary: "JWT preferred over sessions" },
    { id: "t_002", type: "E", summary: "Benchmarks show 3x faster" },
    // ...
  ]
}
```

### 3. `thoughtbox.expand` - On-Demand Full Retrieval

Only fetch full content for specific IDs when truly needed:

```typescript
// Request
{
  tool: "thoughtbox",
  operation: "expand",
  params: { ids: ["t_001", "t_002"] }
}

// Response - full content only for requested thoughts
{
  thoughts: [
    { id: "t_001", full_content: "..." },
    { id: "t_002", full_content: "..." }
  ]
}
```

### 4. `thoughtbox.recursive_query` - RLM-Style Sub-Processing

The most powerful addition - spawn server-side LLM calls:

```typescript
// Request
{
  tool: "thoughtbox",
  operation: "recursive_query",
  params: {
    // Partition strategy
    partition: {
      by: "topic" | "time_range" | "chunk_size",
      value: "auth" | "last_week" | 20
    },
    // Sub-query to run on each partition
    sub_query: "Extract the main conclusion from these thoughts",
    // Aggregation of sub-results
    aggregate: "Synthesize these partition summaries into overall conclusions",
    // Model to use for sub-queries (cheaper = better for partitions)
    sub_model: "haiku"
  }
}

// Response - only the aggregated result
{
  result: "Overall conclusions across 5 partitions...",
  metadata: {
    partitions_processed: 5,
    thoughts_per_partition: [12, 8, 15, 7, 5],
    sub_model_calls: 5,
    aggregate_model_calls: 1
  }
}
```

## Implementation Considerations

### Server-Side LLM Calls

The server needs ability to make LLM calls. Options:

1. **Anthropic API directly**: Server calls Claude API for summarization
2. **Configurable endpoint**: User provides API key, server uses it
3. **Local models**: Server runs small local model (Llama, etc.) for sub-queries

### Cost Control

RLM shows sub-queries can be **cheaper** than full context processing:
- Use Haiku for partition processing
- Use larger model only for final aggregation
- Set `max_response_tokens` to bound costs

### Privacy/Security

Server-side LLM calls mean thoughts pass through additional processing:
- Consider encryption at rest
- Allow "local-only" mode that disables server-side LLM
- Audit logging of what was processed

## Comparison: Current vs. RLM-Inspired

| Scenario | Current Tokens | RLM-Inspired Tokens |
|----------|---------------|---------------------|
| "Summarize last 50 thoughts" | ~8000 (all thoughts) | ~200 (summary only) |
| "Find conclusion about X" | ~3000 (matching thoughts) | ~100 (answer only) |
| "Count hypotheses" | ~5000 (all H-type) | ~20 (just the number) |
| "Extract all decisions" | ~10000 (full session) | ~500 (decisions only) |

**Potential 10-40x reduction in context consumption.**

## The Cipher's New Role

With server-side computation, the cipher's role shifts:

**Before**: Compress thoughts to reduce retrieval cost
**After**: Compress thoughts for *efficient server-side processing*

The cipher becomes an **internal efficiency optimization** rather than a context-saving mechanism. Server processes compressed thoughts, returns natural language summaries.

## Interaction with Claude Code's Task Tool

There's an interesting alternative: use Claude Code's existing `Task` tool to spawn sub-agents:

```
Agent: [Task tool: "Query thoughtbox for auth conclusions and summarize"]
Sub-agent: [makes thoughtbox calls, processes, returns summary]
Agent: [receives only the summary, not sub-agent's full context]
```

This achieves similar isolation without server changes. Worth exploring as a stopgap.

## Phased Implementation

### Phase 1: Peek/Expand Pattern
- Add `peek` operation (IDs + summaries only)
- Add `expand` operation (full content for specific IDs)
- Minimal server changes, immediate context savings

### Phase 2: Server-Side Queries
- Add `query` operation with basic aggregations (count, filter, extract)
- No LLM calls yet, just deterministic operations

### Phase 3: Recursive Processing
- Add server-side LLM capability
- Implement `recursive_query` with partition/aggregate
- Full RLM-style architecture

## Open Questions

1. **Latency**: Server-side LLM calls add latency. Acceptable tradeoff?
2. **Model consistency**: Sub-queries use different model than main conversation. Coherence issues?
3. **Debugging**: Harder to see what server computed. Need good metadata/logging.
4. **Cost allocation**: Who pays for server-side LLM calls?

## Relationship to Existing Thoughtbox Concepts

| Existing | RLM Enhancement |
|----------|-----------------|
| Session storage | Becomes queryable environment |
| Thought chains | Partition boundaries for recursive processing |
| Cipher notation | Internal processing efficiency |
| Notebook | Could become the "REPL" interface |

## Success Metrics

- **Context reduction**: Measure tokens in conversation per "retrieval" operation
- **Answer quality**: Does server-side summarization maintain accuracy?
- **Cost**: Total LLM cost (client + server) vs. current approach
- **Latency**: End-to-end response time

## References

- [Recursive Language Models](https://arxiv.org/abs/2512.24601) - The core RLM paper
- [MemGPT](https://arxiv.org/abs/2310.08560) - Similar "OS for LLMs" concept
- [CodeAct](https://arxiv.org/abs/2402.01030) - REPL-based agent environments

---

**Created**: 2025-01-16
**Status**: Idea - needs architectural review
**Priority**: High - addresses fundamental context efficiency problem
**Complexity**: High - requires server-side LLM capability
**Related**: `001-staged-cipher-learning.md`, `src/resources/thoughtbox-cipher-content.ts`
