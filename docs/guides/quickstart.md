# Quickstart

Get connected and record your first thought in under 5 minutes.

## 1. Get Your API Key

Sign in to the [Thoughtbox web app](https://app.kastalienresearch.ai). Copy your API key from the dashboard. It starts with `tbx_`.

## 2. Connect Claude Code

Add Thoughtbox to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "thoughtbox": {
      "type": "http",
      "url": "https://mcp.kastalienresearch.ai/mcp?key=tbx_YOUR_KEY_HERE"
    }
  }
}
```

Restart Claude Code. Thoughtbox tools appear as `mcp__thoughtbox__thoughtbox_search` and `mcp__thoughtbox__thoughtbox_execute`.

## 3. Record Your First Thought

Use `thoughtbox_execute` to start a reasoning session:

```javascript
// thoughtbox_execute
async () => {
  return await tb.thought({
    thought: "Exploring Thoughtbox for the first time. Testing connection and basic thought recording.",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 1,
    totalThoughts: 5,
    sessionTitle: "Getting Started",
    sessionTags: ["onboarding"]
  });
}
```

The response confirms your thought was recorded:

```json
{
  "thoughtNumber": 1,
  "sessionId": "a1b2c3d4-..."
}
```

The first thought creates a session automatically. Subsequent thoughts append to it.

## 4. Add More Thoughts

Record a second thought:

```javascript
async () => {
  return await tb.thought({
    thought: "The session was created automatically. I can branch, revise, and use different thought types.",
    thoughtType: "reasoning",
    nextThoughtNeeded: true,
    thoughtNumber: 2,
    totalThoughts: 5
  });
}
```

## 5. Complete the Session

Set `nextThoughtNeeded: false` to close the session cleanly:

```javascript
async () => {
  return await tb.thought({
    thought: "Connection works. Session management is automatic. Ready to explore deeper features.",
    thoughtType: "reasoning",
    nextThoughtNeeded: false,
    thoughtNumber: 3,
    totalThoughts: 3
  });
}
```

## 6. Verify It Persisted

List your sessions to confirm:

```javascript
async () => {
  return await tb.session.list({ limit: 5 });
}
```

Your "Getting Started" session appears with `status: "completed"` and `thoughtCount: 3`.

## What's Next

- [Sessions](./sessions.md) — search, resume, export, and analyze your reasoning
- [Knowledge Graph](./knowledge-graph.md) — persist insights across sessions
- [Interleaved Thinking](./interleaved-thinking.md) — structure research and development tasks
- [Ulysses Protocol](./ulysses-protocol.md) — disciplined debugging when you're stuck
- [Subagent Patterns](./subagent-patterns.md) — manage context with subagent isolation
- [Observability](./observability.md) — set up telemetry and cost tracking
