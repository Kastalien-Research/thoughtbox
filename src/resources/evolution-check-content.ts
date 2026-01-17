/**
 * Evolution Check Pattern (A-Mem Retroactive Linking)
 *
 * Instructions for using Claude Code's Task tool to check which existing
 * thoughts should be updated when a new thought is added.
 *
 * Based on: A-Mem paper (arxiv.org/abs/2502.12110)
 * Pattern: Memory learning from memory - existing thoughts become richer
 * as new related thoughts arrive.
 */

export const EVOLUTION_CHECK_CONTENT = `# Evolution Check Pattern

Use Claude Code's Task tool to check which prior thoughts should be updated when a new insight is added.

---

## The Problem

When you add a new thought that contains an insight, related earlier thoughts remain static:

\`\`\`
Thought 1: "Consider rate limiting for the API"
Thought 2: "Redis could handle caching"
Thought 3: "Need to handle burst traffic"
Thought 4: "The rate limiter should use sliding window, not fixed buckets" ← NEW INSIGHT

Earlier thoughts don't know about the sliding window decision!
\`\`\`

## The Solution

Spawn a Haiku sub-agent to evaluate which thoughts should evolve:

\`\`\`
You: [spawn Haiku sub-agent with thought content]
Sub-agent: [evaluates each thought against new insight]
Sub-agent: [returns compact list: "S1: UPDATE, S2: NO_UPDATE, S3: UPDATE"]
           ↓
~50 tokens in YOUR context (vs ~800 for full evaluation)
\`\`\`

---

## How to Use

### After Adding a New Thought

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "model": "haiku",
  "description": "Check evolution candidates",
  "prompt": "Evaluate which prior thoughts should be updated based on a new insight.\\n\\nNEW THOUGHT (just added):\\n<new_thought>\\n\\nPRIOR THOUGHTS:\\n<prior_thoughts>\\n\\nFor each prior thought, determine:\\n- UPDATE: This thought's context should be enriched with the new insight\\n- NO_UPDATE: This thought is unrelated or already complete\\n\\nBe selective - only suggest updates that add meaningful context.\\n\\nRespond in this EXACT format:\\nS1: [UPDATE|NO_UPDATE] - [reason if UPDATE]\\nS2: [UPDATE|NO_UPDATE] - [reason if UPDATE]\\n..."
}
\`\`\`

### Evolution Criteria

A thought should be updated if the new insight:
1. **Resolves ambiguity** - The new thought answers a question the old thought raised
2. **Adds implementation detail** - The new thought specifies HOW to do what the old thought suggested
3. **Contradicts or refines** - The new thought changes the direction the old thought was going
4. **Creates connection** - The new thought links concepts the old thought mentioned

A thought should NOT be updated if:
1. It's completely unrelated
2. The connection is trivial (just keyword overlap)
3. The old thought already implies what the new thought says

---

## Complete Workflow

### Step 1: Get Session Content

\`\`\`typescript
// Retrieve prior thoughts (you do this, not sub-agent)
const sessionResult = await mcp__thoughtbox__session({
  operation: "get",
  args: { sessionId: "<YOUR_SESSION_ID>" }
});

// Extract thought content for sub-agent
const priorThoughts = sessionResult.thoughts
  .map((t, i) => \`S\${i+1}: \${t.thought}\`)
  .join("\\n");
\`\`\`

### Step 2: Spawn Evolution Checker

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "model": "haiku",
  "description": "Evaluate evolution candidates",
  "prompt": "Evaluate which prior thoughts should be updated.\\n\\nNEW INSIGHT:\\n[Your new thought content here]\\n\\nPRIOR THOUGHTS:\\n[Prior thoughts formatted as S1: ..., S2: ..., etc.]\\n\\nFor each thought, respond ONLY with:\\nS1: [UPDATE|NO_UPDATE] - [brief reason if UPDATE]\\nS2: [UPDATE|NO_UPDATE] - [brief reason if UPDATE]\\n...\\n\\nBe selective. Only suggest UPDATE if the new insight meaningfully enriches the prior thought's context."
}
\`\`\`

### Step 3: Apply Revisions

For each thought marked UPDATE:

\`\`\`typescript
await mcp__thoughtbox__thoughtbox({
  thought: "REVISED: [Original thought content] — Context updated: [How new insight relates]",
  thoughtNumber: [original thought number],
  totalThoughts: [current total],
  nextThoughtNeeded: false,
  isRevision: true,
  revisesThought: [original thought number]
});
\`\`\`

---

## Example Session

\`\`\`
// Session so far:
S1: "We need to implement rate limiting for the API"
S2: "Consider using Redis for the rate limit counters"
S3: "The API handles about 1000 req/s during peak"
S4: "Error responses should include retry-after header"

// New thought added:
S5: "The rate limiter should use a sliding window algorithm, not fixed time buckets - this handles burst traffic better"

// Sub-agent evaluation returns:
S1: UPDATE - Should note that sliding window was chosen as the algorithm
S2: UPDATE - Redis choice is validated; sliding window fits Redis ZSET pattern
S3: NO_UPDATE - Traffic volume is factual, doesn't need algorithm context
S4: NO_UPDATE - Error handling is orthogonal to algorithm choice

// You apply revisions to S1 and S2 using isRevision: true
\`\`\`

---

## Token Cost Analysis

**Without evolution checking**:
- Direct LLM evaluation: ~800 tokens per session review
- In your context: full session content

**With sub-agent pattern**:
- Sub-agent evaluation: ~400 tokens (in sub-agent context)
- In your context: ~50 tokens (just the S1: UPDATE, S2: NO_UPDATE list)

**Break-even**: Always better to use sub-agent for sessions with >3 thoughts.

---

## Sliding Window Optimization

For long sessions, don't check ALL prior thoughts:

\`\`\`typescript
// Only check last N thoughts OR those most similar to new thought
const recentThoughts = thoughts.slice(-5);  // Last 5 only
// OR use similarity threshold if you have embeddings
\`\`\`

---

## Best Practices

1. **Be selective** - Not every new thought needs evolution checking
2. **Batch when possible** - If adding multiple related thoughts, check once at the end
3. **Trust the sub-agent** - Haiku is sufficient for this classification task
4. **Review before applying** - You can ignore sub-agent suggestions if they seem wrong
5. **Track what evolved** - Use revision metadata to see the evolution history

---

## Connection to A-Mem Paper

This pattern implements the core insight from A-Mem (arxiv.org/abs/2502.12110):

> "When a new memory is added, find related existing memories and have the LLM
> update their contextual descriptions to incorporate the new insight."

Key differences from paper:
- We use sub-agents instead of server-side LLM
- We return classification, not full updates (agent does revision)
- We bound context with sliding window

---

## Gateway Alternative

If Thoughtbox tools appear unavailable (common with streaming HTTP clients), use the gateway:

\`\`\`typescript
// Via gateway (always available)
await mcp__thoughtbox__thoughtbox_gateway({
  operation: 'session',
  args: {
    operation: 'get',
    args: { sessionId: '<YOUR_SESSION_ID>' }
  }
});

// For revisions via gateway
await mcp__thoughtbox__thoughtbox_gateway({
  operation: 'thought',
  args: {
    thought: 'REVISED: ...',
    thoughtNumber: 4,
    totalThoughts: 10,
    nextThoughtNeeded: false,
    isRevision: true,
    revisesThought: 4
  }
});
\`\`\`

The gateway routes to the same handlers internally with stage enforcement.

---

## See Also

- \`thoughtbox_cipher\` — Compress thought content
- \`subagent-summarize\` — Context isolation for session retrieval
- \`session\` tool with operation \`get\` — Direct session retrieval
- \`thoughtbox_gateway\` — Always-available router for all operations
- A-Mem paper: https://arxiv.org/abs/2502.12110
`;
