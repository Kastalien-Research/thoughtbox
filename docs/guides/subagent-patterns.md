# Context Isolation Patterns

Patterns for keeping your context window clean when working with Thoughtbox sessions.

## The Context Problem

Retrieving a 50-thought session via `tb.session.get()` puts ~8000 tokens in your context. Do this a few times and you have burned most of your working memory on raw data instead of productive reasoning.

The fix: delegate retrieval to subagents. They read the data, extract what matters, and return a compact result. Your context stays lean.

## Subagent-Summarize

Spawn a subagent to retrieve and summarize a session. Only the summary returns to your context.

### Prompt Template

```
Spawn a subagent (model: haiku):
  "Retrieve and summarize Thoughtbox session.

   1. Call mcp__thoughtbox__thoughtbox_execute with code:
      async () => tb.session.get('SESSION_ID')
   2. Summarize the key insights in 3-5 sentences.

   Return ONLY your summary. Do not include raw thought content."
```

### Result

~80 tokens in your context instead of ~8000. A 100x reduction.

### When to Use

Use this any time you retrieve a session with more than 10 thoughts. Below that threshold, the raw data is small enough to keep inline.

## Evolution-Check (A-Mem)

When a new insight arrives, some prior thoughts may be outdated. Spawn a haiku subagent to classify each prior thought as UPDATE or NO_UPDATE.

### Prompt Template

```
Spawn a subagent (model: haiku):
  "Evaluate which prior thoughts should be updated based on a new insight.

   NEW INSIGHT: [your new thought content]

   PRIOR THOUGHTS:
   S1: [thought 1 content]
   S2: [thought 2 content]
   ...

   For each thought, respond ONLY with:
   S1: [UPDATE|NO_UPDATE] - [brief reason if UPDATE]
   S2: [UPDATE|NO_UPDATE] - [brief reason if UPDATE]

   Be selective. Only suggest UPDATE if the new insight meaningfully
   enriches the prior thought. Keyword overlap alone is not enough."
```

### Applying Updates

For each thought marked UPDATE, revise it with the `isRevision` flag:

```javascript
async () => tb.thought.record({
  sessionId: "SESSION_ID",
  content: "Updated content incorporating new insight",
  thoughtType: "revision",
  isRevision: true,
  revisesThought: "ORIGINAL_THOUGHT_ID"
})
```

### When to Use

Run evolution checks on synthesis, conclusion, or decision thoughts -- not on every thought. The overhead is not worth it for observations or hypotheses that are still forming.

For sessions with more than 30 thoughts, check only the last 10-15. Older thoughts are unlikely to need revision from a single new insight.

## Cost Comparison

| Approach | Your context cost | Info quality |
|----------|------------------|-------------|
| Direct `tb.session.get()` | ~8000 tokens per session | Full raw data |
| Subagent-summarize | ~80 tokens | Summarized insights |
| Evolution-check | ~50 tokens (UPDATE/NO_UPDATE list) | Classification only |

## Choosing the Right Pattern

**Default to subagent-summarize.** It covers the most common case: you need to know what happened in a session without loading every thought.

**Add evolution-check when you are building on prior work.** If your current session extends or revises conclusions from an earlier session, run the check so the knowledge graph stays current.

**Use raw retrieval only for small sessions** (under 10 thoughts) or when you need exact wording -- for example, when quoting a prior decision in an ADR.
