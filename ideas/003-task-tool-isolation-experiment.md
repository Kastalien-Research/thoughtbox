# Experiment: Task Tool Context Isolation

> Testing whether Claude Code's Task tool can achieve RLM-style context isolation

## Hypothesis

When a sub-agent (spawned via Task tool) makes MCP calls to Thoughtbox:
- The sub-agent sees all the Thoughtbox responses in its context
- The **parent conversation** only sees the sub-agent's final summary
- This achieves context isolation without server-side changes

## Result: CONFIRMED

**The Task tool provides RLM-style context isolation.**

## Experiment Details

### Test Data

Used existing session `723a8c91-3a39-4523-814e-87c3b2e6a8cc` with 5 thoughts about video series architecture.

### Phase 1: Direct MCP Call (Baseline)

Called `mcp__thoughtbox__session` with operation `get` directly.

**Result in parent conversation:**
- All 5 thoughts with full content
- Session metadata, branches, resource documentation
- Estimated ~800+ tokens of MCP response in context

### Phase 2: Task Tool Isolation

Spawned sub-agent with prompt:
```
1. Call mcp__thoughtbox__init with operation "get_state"
2. Call mcp__thoughtbox__thoughtbox_cipher to load cipher
3. Call mcp__thoughtbox__session to retrieve session
4. Summarize key conclusions in 2-3 sentences
Return ONLY your summary.
```

**Result in parent conversation:**
```
The session analyzes how to structure a video documentation series
for Thoughtbox. The key conclusion is that the Init workflow should
be the first video because it establishes project scoping and
namespace isolation, which are essential for meaningful memory
retrieval - progressive disclosure is merely a side effect.
```

**Estimated ~80 tokens** - just the summary!

### Comparison

| Approach | Tokens in Parent Context | Information Quality |
|----------|-------------------------|---------------------|
| Direct MCP | ~800+ | Full raw data |
| Task sub-agent | ~80 | Summarized insights |

**10x reduction in context consumption** while preserving key information.

## Key Findings

1. **Sub-agent MCP calls are isolated** - The sub-agent's full Thoughtbox responses do NOT appear in parent conversation

2. **Only final output returns** - Parent sees only what sub-agent explicitly outputs

3. **No server changes needed** - This works with existing Claude Code + MCP infrastructure

4. **Quality is good** - Sub-agent accurately summarized the session content

## Implications for Thoughtbox

This means we can build RLM-style patterns TODAY:

1. **Summarize session** - Spawn sub-agent to retrieve and summarize thoughts
2. **Search and extract** - Sub-agent searches, filters, returns only relevant findings
3. **Multi-session analysis** - Sub-agent loads multiple sessions, synthesizes
4. **Recursive queries** - Sub-agents can spawn their own sub-agents

### Potential New Commands/Skills

```
/thoughtbox-summarize <session-id>
  → Spawns sub-agent to retrieve and summarize session
  → Returns only summary to parent

/thoughtbox-search <query>
  → Sub-agent searches across sessions
  → Returns only matching excerpts

/thoughtbox-synthesize <topic>
  → Sub-agent loads all relevant sessions
  → Returns synthesized conclusions
```

## Limitations Observed

1. **Latency** - Sub-agent adds ~5-10 seconds overhead
2. **Model cost** - Sub-agent uses its own tokens (but cheaper than context overflow)
3. **Progressive disclosure** - Sub-agent must go through init→cipher→tool flow

## Next Steps

1. Build skill/command that wraps this pattern
2. Test with larger sessions (50+ thoughts)
3. Test recursive sub-agents (sub-agent spawning sub-agent)
4. Measure cost/latency tradeoffs at scale

---

**Experiment Date**: 2026-01-16
**Result**: SUCCESS - Task tool provides context isolation
**Implication**: RLM-style architecture possible with existing primitives
