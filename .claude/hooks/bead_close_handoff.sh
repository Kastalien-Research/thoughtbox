#!/usr/bin/env bash
# PostToolUse hook: detects `bd close` in Bash tool calls.
# When detected, outputs a reminder to validate the fix and update handoff.
set -uo pipefail

input_json=$(cat)

tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)
[[ "$tool_name" == "Bash" ]] || exit 0

command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)
[[ "$command" == *"bd close"* ]] || exit 0

# Check if the close actually succeeded
stdout=$(echo "$input_json" | jq -r '.tool_output.stdout // empty' 2>/dev/null)
[[ "$stdout" == *"Closed"* || "$stdout" == *"closed"* ]] || exit 0

# Extract the bead ID(s) from the command
bead_ids=$(echo "$command" | grep -oE 'thoughtbox-[a-z0-9.]+' | tr '\n' ', ' | sed 's/,$//')

cat <<EOF

BEAD CLOSE DETECTED [$bead_ids]

Before continuing, you MUST:

1. STATE the hypothesis you had before starting this fix
2. STATE the validation result (pass/fail/discovered new issue)
3. If FAIL: log what was learned on the bead, increment surprise count
   - 2 consecutive fails on same bead = ULYSSES REFLECT before next attempt
   - New problem discovered = create discovered-from bead
4. If PASS: update session-handoff.json
5. PAUSE and wait for user go-ahead before starting next bead

Run: node "\$CLAUDE_PROJECT_DIR/scripts/utils/update-bead-handoff.mjs" --closed="\$bead_ids"
EOF
