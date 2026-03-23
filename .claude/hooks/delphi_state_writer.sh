#!/usr/bin/env bash
# PostToolUse: Write state for Delphi synthesize enforcement.
# Watches thoughtbox_delphi tool responses for phase transitions.
# When phase=synthesize (N=2), writes synthesize-required sentinel.
# When complete is called successfully, removes it.
#
# State files (in delphi dir):
#   synthesize-required  — sentinel: N=2, must call complete
#   active-session.json  — tracks active Delphi session ID
set -uo pipefail

delphi_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/delphi"
mkdir -p "$delphi_state_dir"

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)

# Only care about MCP tool calls to thoughtbox_delphi
# In Claude Code, MCP tool calls show up as tool_name with the full path
if [[ "$tool_name" != *"delphi"* ]]; then
  exit 0
fi

stdout=$(echo "$input_json" | jq -r '.tool_response.stdout // empty' 2>/dev/null)

# Skip if no stdout (tool errored before returning)
[[ -z "$stdout" ]] && exit 0

# Try to parse the tool response as JSON
phase=$(echo "$stdout" | jq -r '.phase // empty' 2>/dev/null)
session_id=$(echo "$stdout" | jq -r '.session_id // empty' 2>/dev/null)
status=$(echo "$stdout" | jq -r '.status // empty' 2>/dev/null)

# Track active session
if [[ -n "$session_id" ]]; then
  echo "{\"session_id\": \"$session_id\"}" > "$delphi_state_dir/active-session.json"
fi

# Phase transition: entered synthesize
if [[ "$phase" == "synthesize" ]]; then
  touch "$delphi_state_dir/synthesize-required"
fi

# Phase transition: back to inquire (challenge discriminated)
if [[ "$phase" == "inquire" ]]; then
  rm -f "$delphi_state_dir/synthesize-required"
fi

# Terminal state reached: clean up all state
if [[ "$status" == "supported_thesis" \
   || "$status" == "refined_question" \
   || "$status" == "capability_gap" \
   || "$status" == "irreducible_uncertainty" ]]; then
  rm -f "$delphi_state_dir/synthesize-required"
  rm -f "$delphi_state_dir/active-session.json"
fi

exit 0
