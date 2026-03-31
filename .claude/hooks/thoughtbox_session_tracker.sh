#!/usr/bin/env bash
# PostToolUse hook: track active Thoughtbox session ID
# Fires on thoughtbox_execute calls, extracts sessionId, writes to state file.
# Must never block the agent — always exits 0.

set -euo pipefail

input_json=$(cat)

# Extract sessionId or closedSessionId from the tool result
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
