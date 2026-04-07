# Interleaved Retrieval and Chain-of-Thought (IRCoT)

Alternate between reasoning in Thoughtbox and acting with external tools.
The rhythm: think about what you need, search/read/execute, record
findings as a thought, reassess, repeat.

This is not "think then act." It is think-act-think-act in a tight loop
where each thought incorporates what the last action revealed.

## The Pattern

A standard reasoning session stays inside your head. IRCoT breaks out
of that by interleaving retrieval steps (web search, file reads, code
execution) between thoughts. Each thought absorbs what the previous
action returned and decides what to do next.

The discipline: never act without a thought explaining why, and never
think without incorporating what the last action returned.

## Three Modes

Each mode has a resource at `thoughtbox://interleaved/{mode}`.
Load the resource to get the mode's prompt template and constraints.

### Research

Breadth-first investigation. Cover the landscape before going deep.

- **Required tools:** Thoughtbox + search (web, codebase, docs)
- **Priority:** Map the territory. Resist the urge to deep-dive on
  the first interesting result.
- **Cadence:** Alternate search and recording. Every search result
  gets a thought before the next search.

### Development

Code implementation loops. Write, test, observe, record, adjust.

- **Required tools:** Thoughtbox + code repo + execution environment
- **Priority:** Incremental validation. Test early, test often. Record
  what each test run revealed, not just pass/fail.
- **Cadence:** Plan in a thought, implement, run tests, record outcome
  in a thought, adjust plan.

### Analysis

Deep examination of existing material. No external retrieval needed.

- **Required tools:** Thoughtbox only
- **Priority:** Patterns, relationships, implications. Extract
  structure from what you already have.
- **Cadence:** Read, reflect in a thought, re-read with the new lens,
  reflect again.

## Sufficiency Assessment

Before starting, inventory your tools. Ask:

- Do I have search capabilities for a research task?
- Do I have execution capabilities for a development task?
- Can I access the material I need for an analysis task?

If you lack a required tool, acknowledge the limitation in your first
thought. The protocol's honesty requirement prevents fabricated results.
A research session without search tools is an analysis session --
call it what it is.

## Synthesis Checkpoints

Every 10-15 thoughts, record a synthesis thought that:

1. Consolidates findings so far
2. Identifies contradictions between sources or observations
3. Lists open questions ranked by priority
4. Sets the direction for the next cycle

This prevents drift in long sessions. Without synthesis checkpoints,
thought 30 may contradict thought 5 without anyone noticing.

## Worked Example

**Task:** "What rate limiting approaches work for WebSocket connections?"

### Step 1: Context snapshot

State the question, list tools, note constraints.

```javascript
async () => {
  await tb.thought({
    thought: "Research: What rate limiting works for WebSocket " +
      "connections? Tools: WebSearch, Grep, Read. Constraint: " +
      "must support per-connection state.",
    thoughtType: "context_snapshot",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 20,
    sessionTitle: "Research: WebSocket Rate Limiting",
    sessionTags: ["research", "websocket", "rate-limiting"],
    contextData: {
      toolsAvailable: ["WebSearch", "Grep", "Read"],
      constraints: ["per-connection state required"]
    }
  });
}
```

### Step 2: Search

Search for "WebSocket rate limiting approaches" using your search tool.
Read the results. Do not record anything yet -- absorb first.

### Step 3: Record finding

Capture what the search revealed, with source attribution.

```javascript
async () => {
  await tb.thought({
    thought: "Finding: Token bucket algorithm works for WebSocket " +
      "but requires per-connection state tracking. Source: [url]. " +
      "Each connection needs its own bucket, stored server-side.",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 3,
    totalThoughts: 20
  });
}
```

### Step 4: Follow-up search

The finding raised a question: how to manage per-connection state at
scale. Search for "connection-level state management WebSocket Redis."

### Step 5: Record finding

Capture what you learned about Redis sorted sets for sliding window
rate limiting. Note how it differs from the token bucket approach.

### Step 6: Synthesis checkpoint

Consolidate, identify contradictions, set priorities.

```javascript
async () => {
  await tb.thought({
    thought: "Synthesis at thought 6: Two viable approaches -- " +
      "(1) token bucket with per-connection Redis keys, " +
      "(2) sliding window with Redis sorted sets. Token bucket " +
      "is simpler; sliding window handles bursts better. Gap: " +
      "need performance benchmarks for 10k+ concurrent connections.",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 6,
    totalThoughts: 20
  });
}
```

### Step 7: Targeted search

Search for the identified gap: performance benchmarks at scale.

### Step 8: Conclusion

Close the session with `nextThoughtNeeded: false`. State the
recommendation, the evidence behind it, and any remaining uncertainty.

---

The pattern is simple: think, act, think, act. The discipline is in
never skipping the think step, never fabricating the act step, and
pausing to synthesize before drift sets in.
