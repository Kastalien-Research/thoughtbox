---
name: thoughtbox:research
description: >
  Structured research using Thoughtbox IRCoT (Interleaved Retrieval and
  Chain-of-Thought). Triggers on: "research", "investigate", "explore",
  "literature review", "what do we know about".
argument-hint: "[research question or topic]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, ToolSearch, WebFetch, WebSearch
---

Research this topic using Thoughtbox IRCoT: $ARGUMENTS

## Protocol References

- Cipher notation for long sessions: `thoughtbox://cipher`
- IRCoT pattern background: `thoughtbox://interleaved/research`

## Phase 1: Setup

Create a Thoughtbox session and assess available tools.

```javascript
// thoughtbox_execute
async () => {
  await tb.thought({
    thought: "Research question: $ARGUMENTS. Available search tools: [list from ToolSearch]. Strategy: breadth-first scan, then depth on promising leads.",
    thoughtType: "context_snapshot",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 30,
    sessionTitle: "Research: $ARGUMENTS",
    sessionTags: ["research"],
    contextData: {
      toolsAvailable: [],
      constraints: ["primary sources preferred"]
    }
  });
}
```

Steps:
1. Use ToolSearch to discover available search tools (Exa, WebSearch, WebFetch, Grep, Read).
2. Record thought 1 as `context_snapshot`: state the research question, available tools, constraints.
3. If no search tools are available, note the limitation and rely on codebase/knowledge graph only.

## Phase 2: IRCoT Loop (Think, Search, Integrate, Repeat)

Run this cycle until the question is answered or no productive search avenues remain.

### 2a: Reason

Record a `reasoning` thought: what do I need to find out next? What gaps remain?

```javascript
// thoughtbox_execute
async () => {
  await tb.thought({
    thought: "Gap: I know X but not Y. Next search: [specific query]. Rationale: [why this fills the gap].",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: N,
    totalThoughts: 30
  });
}
```

### 2b: Search

Use the best available tool for the current sub-question:
- **Exa / WebSearch**: external knowledge, recent publications, API docs
- **Grep / Glob / Read**: codebase evidence, local files, prior research
- **Knowledge graph**: `tb.knowledge.searchEntities()` for prior Thoughtbox findings

### 2c: Integrate

Record findings as a `reasoning` thought with evidence references. Include source URLs or file paths.

```javascript
// thoughtbox_execute
async () => {
  await tb.thought({
    thought: "Finding: [what was learned]. Source: [url/path]. Confidence: [high/medium/low]. Implication: [how this changes understanding].",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: N,
    totalThoughts: 30
  });
}
```

### 2d: Synthesis Checkpoint (every 10-15 thoughts)

Consolidate findings so far. Identify contradictions, gaps, and next priorities.

```javascript
// thoughtbox_execute
async () => {
  await tb.thought({
    thought: "Synthesis at thought N: [summary of key findings]. Contradictions: [if any]. Remaining gaps: [list]. Priority for next cycle: [specific question].",
    thoughtType: "synthesis",
    nextThoughtNeeded: true,
    thoughtNumber: N,
    totalThoughts: 30
  });
}
```

### Loop Exit Criteria

Stop the IRCoT loop when ANY of these hold:
- The research question is answered with sufficient evidence
- No more productive search avenues exist
- Thought budget (totalThoughts) is exhausted

## Phase 3: Knowledge Persistence

Bridge findings into the Thoughtbox knowledge graph for future retrieval.

For each key finding:

```javascript
// thoughtbox_execute
async () => {
  const entity = await tb.knowledge.createEntity({
    name: "Finding: [concise label]",
    entityType: "Insight",
    observations: [
      "[key claim]. Source: [url/path]. Confidence: [level]."
    ]
  });

  // Link related findings
  await tb.knowledge.createRelation({
    from: entity.id,
    to: relatedEntityId,
    relationType: "BUILDS_ON"
  });
}
```

Relation types to use:
- `BUILDS_ON` — finding extends or deepens another
- `CONTRADICTS` — finding conflicts with another
- `RELATES_TO` — thematic connection without causal link
- `SUPPORTS` — finding provides evidence for another

Add observations with source attribution to every entity.

## Phase 4: Delivery

### 4a: Conclusion

Record a final thought closing the session.

```javascript
// thoughtbox_execute
async () => {
  await tb.thought({
    thought: "Conclusion: [answer to original question]. Key evidence: [top 3 sources]. Confidence: [overall level]. Open questions: [if any].",
    thoughtType: "conclusion",
    nextThoughtNeeded: false,
    thoughtNumber: N,
    totalThoughts: N
  });
}
```

### 4b: Export

Present findings to the user as structured markdown:
- **Question**: the original research question
- **Answer**: concise answer (2-3 sentences)
- **Evidence**: numbered list of key findings with sources
- **Confidence**: overall assessment with reasoning
- **Open Questions**: what remains unanswered

### 4c: Extract Learnings

If the session produced reusable insights, extract them.

```javascript
// thoughtbox_execute
async () => {
  const analysis = await tb.session.analyze();
  if (analysis.insightDensity > 0.3) {
    await tb.session.extractLearnings();
  }
}
```

## Anti-Patterns

- **Searching without reasoning first** — always record what you expect to find before searching.
- **Recording every intermediate step** — only record findings that change understanding.
- **Skipping synthesis checkpoints** — drift compounds; synthesize every 10-15 thoughts.
- **Orphan knowledge** — every entity needs at least one relation. Isolated nodes are unfindable.
- **Premature conclusion** — do not conclude until you have checked for contradictory evidence.
