/**
 * Subagent Summarize Pattern
 *
 * Instructions for using Claude Code's Task tool to achieve RLM-style
 * context isolation when retrieving Thoughtbox sessions.
 */

export const SUBAGENT_SUMMARIZE_CONTENT = `# Subagent Summarize Pattern

Use Claude Code's Task tool to retrieve and summarize Thoughtbox sessions **without polluting your conversation context**.

---

## The Problem

When you call Thoughtbox MCP tools directly, the full response appears in your conversation:

\`\`\`
You: [call session.get]
Thoughtbox: [returns 50 thoughts, 8000 tokens]
            ↓
All 8000 tokens are now in YOUR context
\`\`\`

## The Solution

Spawn a sub-agent to do the retrieval. Only its summary returns to you:

\`\`\`
You: [spawn sub-agent via Task tool]
Sub-agent: [calls Thoughtbox, retrieves 50 thoughts]
Sub-agent: [summarizes internally]
Sub-agent: [returns 200-token summary]
            ↓
Only 200 tokens in YOUR context
\`\`\`

**10-40x context reduction** while preserving key information.

---

## How to Use

### Summarize a Session

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "description": "Summarize Thoughtbox session",
  "prompt": "Retrieve and summarize Thoughtbox session.\\n\\n1. Call mcp__thoughtbox__init with operation 'get_state'\\n2. Call mcp__thoughtbox__thoughtbox_cipher\\n3. Call mcp__thoughtbox__session with operation 'get' and sessionId '<SESSION_ID>'\\n4. Summarize the key insights in 3-5 sentences\\n\\nReturn ONLY your summary. Do not include raw thought content."
}
\`\`\`

### Search Across Sessions

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "description": "Search Thoughtbox sessions",
  "prompt": "Search Thoughtbox for information about <TOPIC>.\\n\\n1. Call mcp__thoughtbox__init with operation 'get_state'\\n2. Call mcp__thoughtbox__thoughtbox_cipher\\n3. Call mcp__thoughtbox__session with operation 'list'\\n4. For relevant sessions, call operation 'get' to retrieve thoughts\\n5. Extract only information related to <TOPIC>\\n\\nReturn a concise summary of findings. Do not include raw thought content."
}
\`\`\`

### Synthesize Multiple Sessions

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "description": "Synthesize Thoughtbox sessions",
  "prompt": "Synthesize conclusions across multiple Thoughtbox sessions.\\n\\n1. Initialize Thoughtbox (init → cipher)\\n2. List sessions with tags matching '<TAG>'\\n3. Retrieve each relevant session\\n4. Identify common themes, contradictions, and key conclusions\\n5. Synthesize into a coherent summary\\n\\nReturn only your synthesis. Do not include raw thoughts."
}
\`\`\`

---

## Why This Works

Claude Code's Task tool spawns an isolated sub-agent:
- Sub-agent has its own conversation context
- Sub-agent's MCP calls stay in ITS context
- Only the sub-agent's final output returns to parent
- Parent never sees the full MCP responses

This is **RLM-style context isolation** using existing primitives.

---

## Template Variables

Replace these in the prompts above:

| Variable | Description |
|----------|-------------|
| \`<SESSION_ID>\` | UUID of session to retrieve |
| \`<TOPIC>\` | Search topic or keyword |
| \`<TAG>\` | Session tag to filter by |

---

## Best Practices

1. **Be specific about output format** - Tell sub-agent exactly what to return
2. **Forbid raw content** - Explicitly say "do not include raw thought content"
3. **Set token budget** - "Summarize in 3-5 sentences" or "max 200 words"
4. **Use haiku for simple tasks** - Add \`"model": "haiku"\` for faster/cheaper sub-agents

---

## Example: Full Invocation

\`\`\`typescript
// In your Claude Code conversation:
const result = await Task({
  subagent_type: "general-purpose",
  model: "haiku",  // Cheaper for summarization
  description: "Summarize auth session",
  prompt: \`
    Retrieve and summarize Thoughtbox session about authentication.

    Steps:
    1. mcp__thoughtbox__init({ operation: "get_state" })
    2. mcp__thoughtbox__thoughtbox_cipher()
    3. mcp__thoughtbox__session({ operation: "get", args: { sessionId: "abc-123" }})
    4. Extract key conclusions about authentication decisions

    Return a 3-sentence summary. No raw thoughts.
  \`
});

// result contains ONLY the summary, not the full session
\`\`\`

---

## Experimental Results

Tested 2026-01-16:

| Approach | Context Cost | Info Quality |
|----------|--------------|--------------|
| Direct MCP call | ~800 tokens | Full raw data |
| Sub-agent pattern | ~80 tokens | Summarized insights |

**10x reduction confirmed.**

---

## Alternative: Via Gateway Tool

If tool list doesn't refresh (common with streaming HTTP clients), use the gateway:

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "description": "Summarize Thoughtbox session via gateway",
  "prompt": "Retrieve and summarize session via gateway tool.\\n\\n1. mcp__thoughtbox__thoughtbox_gateway({ operation: 'start_new', args: { newWork: { task: 'retrieve' } } })\\n2. mcp__thoughtbox__thoughtbox_gateway({ operation: 'cipher' })\\n3. mcp__thoughtbox__thoughtbox_gateway({ operation: 'session', args: { operation: 'get', args: { sessionId: '<SESSION_ID>' } } })\\n4. Summarize key insights (3-5 sentences)\\n\\nReturn ONLY your summary. Do not include raw thought content."
}
\`\`\`

### When to Use Gateway

Use the gateway approach when:
- Client doesn't refresh tool lists properly
- Using streaming HTTP transport
- Other Thoughtbox tools appear unavailable

The gateway tool is always enabled at Stage 0 and routes to all other handlers internally.

---

## See Also

- \`thoughtbox_cipher\` - Compress thought content (complementary approach)
- \`session.get\` - Direct retrieval (when you need full content)
- \`thoughtbox_gateway\` - Always-available router for all operations
- RLM paper: https://arxiv.org/abs/2512.24601
`;
