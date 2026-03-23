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
  "prompt": "Retrieve and summarize Thoughtbox session.\\n\\n1. Call mcp__thoughtbox__thoughtbox_execute with code: async () => tb.session.get('<SESSION_ID>')\\n2. Summarize the key insights in 3-5 sentences\\n\\nReturn ONLY your summary. Do not include raw thought content."
}
\`\`\`

### Search Across Sessions

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "description": "Search Thoughtbox sessions",
  "prompt": "Search Thoughtbox for information about <TOPIC>.\\n\\n1. Call mcp__thoughtbox__thoughtbox_execute with code: async () => tb.session.list()\\n2. For relevant sessions, call mcp__thoughtbox__thoughtbox_execute with code: async () => tb.session.get('<SESSION_ID>')\\n3. Extract only information related to <TOPIC>\\n\\nReturn a concise summary of findings. Do not include raw thought content."
}
\`\`\`

### Synthesize Multiple Sessions

\`\`\`json
{
  "tool": "Task",
  "subagent_type": "general-purpose",
  "description": "Synthesize Thoughtbox sessions",
  "prompt": "Synthesize conclusions across multiple Thoughtbox sessions.\\n\\n1. Call mcp__thoughtbox__thoughtbox_execute with code: async () => tb.session.list()\\n2. Filter sessions with tags matching '<TAG>'\\n3. Retrieve each relevant session via mcp__thoughtbox__thoughtbox_execute with code: async () => tb.session.get('<SESSION_ID>')\\n4. Identify common themes, contradictions, and key conclusions\\n5. Synthesize into a coherent summary\\n\\nReturn only your synthesis. Do not include raw thoughts."
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
    1. Call mcp__thoughtbox__thoughtbox_execute with code:
       async () => tb.session.get("abc-123")
    2. Extract key conclusions about authentication decisions

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

## See Also

- \`thoughtbox://cipher\` - Token-efficient notation system (complementary approach)
- \`thoughtbox_execute\` with \`tb.session.get(id)\` - Direct retrieval (when you need full content)
- RLM paper: https://arxiv.org/abs/2512.24601
`;
