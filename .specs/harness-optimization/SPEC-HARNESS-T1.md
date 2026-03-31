# SPEC-HARNESS-T1: Harness Optimization — Tier 1

## Summary

Tier 1 reduces friction for interleaved thinking by making three harness-only changes (no server code modifications):

1. **SessionStart Primer** — inject a short instruction priming agents to use Thoughtbox between tool calls
2. **Interleaved Thinking Rewrite** — replace the 5-phase ceremony with an OODA loop controller
3. **PostToolUse Session Tracker** — extract and persist the active Thoughtbox sessionId for tooling

These changes make interleaved thinking the default behavior rather than an opt-in prompt invocation.

## Changes

### 1. SessionStart Primer

**File:** `.claude/hooks/session_start.sh`

**What:** Append a Thoughtbox primer block to the `context` variable, gated on two conditions:
- Thoughtbox MCP tools are available (the tool `thoughtbox_execute` appears in the environment)
- The agent is NOT a sub-agent (no `CLAUDE_AGENT_ID` env var set)

**Where in the file:** Insert after the session metrics block (line 153) and before the final `jq` output (line 156).

**Exact code to add:**

```bash
    # Thoughtbox interleaved thinking primer
    # Only inject for top-level agents with Thoughtbox available
    if [[ -z "${CLAUDE_AGENT_ID:-}" ]]; then
        # Check if thoughtbox tools are in the MCP config
        mcp_config="$project_dir/.mcp.json"
        if [[ -f "$mcp_config" ]] && jq -e '.mcpServers["thoughtbox-cloud-run"] // .mcpServers["thoughtbox"]' "$mcp_config" > /dev/null 2>&1; then
            context+="\n<thoughtbox-primer>\n"
            context+="Record your reasoning in Thoughtbox between tool calls. "
            context+="Use tb.thought() for observations and intermediate conclusions. "
            context+="Use decision_frame when choosing between alternatives. "
            context+="Use assumption_update when evidence changes your assumptions. "
            context+="Think between every action — not just at the start and end. "
            context+="The rhythm is: Think, Act, Think, Act.\n"
            context+="</thoughtbox-primer>\n"
        fi
    fi
```

**Word count:** 55 words (under the 100-word limit).

**Rationale for gating:**
- `CLAUDE_AGENT_ID` is set by Claude Code when spawning sub-agents. Sub-agents have narrower scope and should not be burdened with Thoughtbox ceremony.
- Checking `.mcp.json` for the Thoughtbox server entry is more reliable than checking environment variables at hook time, since MCP tool names are not exposed as env vars in SessionStart hooks.

### 2. Interleaved Thinking Rewrite

**File:** `src/prompts/contents/interleaved-thinking-content.ts`

**What:** Replace the entire `INTERLEAVED_THINKING_CONTENT` export with a loop controller design.

**Problems with the current content:**
- References `mcp__thoughtbox__thoughtbox` (old tool name; current is `thoughtbox_execute`)
- 5 rigid phases: tool inventory, sufficiency check, strategy, execution, final answer
- Creates `.interleaved-thinking/` folder with `tooling-inventory.md`, `strategy.md`, `final-answer.md`
- Allocates a "thought budget" — an artificial constraint that creates more ceremony than value
- Sequential pipeline instead of adaptive loop

**Exact new content:**

```typescript
export const INTERLEAVED_THINKING_CONTENT = `# Interleaved Thinking

You are a reasoning agent. Your job is to complete the user's task by alternating between thinking (recording reasoning in Thoughtbox) and acting (using your tools).

## The Loop

\`\`\`
while task is not complete:
    THINK — record what you know, what you need, what you'll try
    ACT   — use a tool to make progress
    THINK — record what happened, what changed, what's next
\`\`\`

This is an OODA loop (Observe-Orient-Decide-Act), not a sequential pipeline. You can loop back to any earlier stage when new information changes your understanding.

## How to Think

Use \`thoughtbox_execute\` to record reasoning. Write JavaScript against the \`tb\` SDK:

- **tb.thought()** — observations, intermediate conclusions, status checks
- **decision_frame** operation — when choosing between alternatives (frame the options, criteria, and tradeoffs before deciding)
- **assumption_update** operation — when evidence contradicts or refines a prior assumption

## Rhythm Guidelines

- **Think before the first action.** Frame the task, identify what you know and don't know.
- **Think after every tool result.** What did you learn? Did it confirm or contradict your assumptions? What should you do next?
- **Think when stuck.** If two actions in a row didn't make progress, stop and reframe.
- **Don't over-think.** A thought can be one sentence. Not every thought needs to be a decision frame.

## What NOT to Do

- Do not create files to track your thinking (no \`.interleaved-thinking/\` folder)
- Do not inventory your tools — you already know what's available
- Do not allocate a "thought budget" — think as much or as little as the task requires
- Do not follow a rigid phase sequence — adapt to what you discover

## Task

$ARGUMENTS
`;
```

### 3. PostToolUse Session Tracker

**File (new):** `.claude/hooks/thoughtbox_session_tracker.sh`

**What:** A PostToolUse hook that fires specifically on `thoughtbox_execute` calls, extracts the sessionId from the response, and writes it to `.claude/state/active_thoughtbox_session`.

**Exact script:**

```bash
#!/usr/bin/env bash
# PostToolUse hook: track active Thoughtbox session ID
# Fires on thoughtbox_execute calls, extracts sessionId, writes to state file.
# Must never block the agent — always exits 0.

set -euo pipefail

input_json=$(cat)

# Extract sessionId or closedSessionId from the tool result
# The tool result is nested under tool_result or similar — try common paths
session_id=$(echo "$input_json" \
    | jq -r '
        .tool_result.content // .tool_result // .
        | if type == "array" then .[0].text // .[0] else . end
        | if type == "string" then (try fromjson catch .) else . end
        | .sessionId // .closedSessionId // .session_id // empty
    ' 2>/dev/null || true)

if [[ -n "$session_id" && "$session_id" != "null" ]]; then
    state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state"
    mkdir -p "$state_dir"
    echo "$session_id" > "$state_dir/active_thoughtbox_session"
fi

exit 0
```

**Wiring in `.claude/settings.json`:**

Add a new entry to the `PostToolUse` array with a specific matcher:

```json
{
    "matcher": "mcp__thoughtbox-cloud-run__thoughtbox_execute",
    "hooks": [
        {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR/.claude/hooks/thoughtbox_session_tracker.sh\""
        }
    ]
}
```

This entry goes AFTER the existing wildcard PostToolUse entry (which has `"matcher": ""`). The specific matcher ensures this hook only fires on `thoughtbox_execute` calls, not on every tool invocation.

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `.claude/hooks/session_start.sh` | Edit | Add Thoughtbox primer block (lines 153-166) |
| `src/prompts/contents/interleaved-thinking-content.ts` | Replace | New OODA loop content replacing 5-phase ceremony |
| `.claude/hooks/thoughtbox_session_tracker.sh` | Create | New PostToolUse hook for session tracking |
| `.claude/settings.json` | Edit | Add matcher-specific PostToolUse entry for session tracker |

## Testing Plan

### 1. SessionStart Primer

- **With Thoughtbox configured:** Run a session with `.mcp.json` containing `thoughtbox-cloud-run`. Verify the `<thoughtbox-primer>` block appears in the SessionStart hook output.
- **Without Thoughtbox:** Remove the Thoughtbox entry from `.mcp.json`. Verify no primer is injected.
- **Sub-agent:** Set `CLAUDE_AGENT_ID=test` in the environment. Verify no primer is injected even with Thoughtbox configured.
- **Missing .mcp.json:** Delete `.mcp.json`. Verify no error and no primer.

### 2. Interleaved Thinking Rewrite

- **Build check:** `npx tsc --noEmit` passes with the new content.
- **Content verification:** Read the compiled output and verify no references to old tool names (`mcp__thoughtbox__thoughtbox`), no file creation instructions, no phase numbering.
- **Behavioral smoke test:** Use the interleaved-thinking prompt with a simple task. Verify the agent uses `thoughtbox_execute` in an OODA pattern without creating `.interleaved-thinking/` folder.

### 3. PostToolUse Session Tracker

- **Hook fires on correct tool:** Invoke `thoughtbox_execute` and verify `.claude/state/active_thoughtbox_session` is created with the correct session ID.
- **Hook does NOT fire on other tools:** Invoke a different tool (e.g., `Read`) and verify the hook does not execute (check with `set -x` or add a debug log).
- **Malformed input:** Pipe invalid JSON to the hook. Verify it exits 0 without error.
- **Missing state directory:** Delete `.claude/state/`. Verify the hook creates it.
- **No sessionId in response:** Pipe a valid JSON response without a sessionId field. Verify the hook exits 0 and does not write the file.

## Rollback Plan

All changes are isolated to the harness layer. No server code is modified.

1. **SessionStart Primer:** Remove the added block from `session_start.sh` (lines between the metrics block and the jq output). The hook returns to its previous behavior.
2. **Interleaved Thinking:** Revert `src/prompts/contents/interleaved-thinking-content.ts` to the previous commit's version via `git checkout HEAD~1 -- src/prompts/contents/interleaved-thinking-content.ts`.
3. **Session Tracker:** Remove `thoughtbox_session_tracker.sh` and delete the matcher entry from `.claude/settings.json` PostToolUse array. Delete `.claude/state/active_thoughtbox_session` if present.

Each change can be rolled back independently without affecting the others.
