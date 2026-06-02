#!/usr/bin/env bash
# PreToolUse: Require Read before Edit/Write on existing files.
# Prevents blind overwrites by checking file_access.jsonl.
set -uo pipefail

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')

# Only guard Edit and Write on existing files
case "$tool_name" in
  Edit|Write) ;;
  *) exit 0 ;;
esac

file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // ""')
[[ -z "$file_path" || ! -f "$file_path" ]] && exit 0

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
access_log="$project_dir/.claude/state/file_access.jsonl"
[[ ! -f "$access_log" ]] && { echo "BLOCKED: Must Read $file_path before modifying it." >&2; exit 2; }

abs_path=$(realpath "$file_path" 2>/dev/null || echo "$file_path")

last_read=$(jq -sr --arg p "$abs_path" \
  'map(select(.path == $p and .tool == "Read")) | .[-1].ts // ""' \
  "$access_log" 2>/dev/null || echo "")

if [[ -z "$last_read" ]]; then
  echo "BLOCKED: Must Read $file_path before modifying it." >&2
  exit 2
fi

last_write=$(jq -sr --arg p "$abs_path" \
  'map(select(.path == $p and (.tool == "Write" or .tool == "Edit"))) | .[-1].ts // ""' \
  "$access_log" 2>/dev/null || echo "")

if [[ -n "$last_write" && "$last_read" < "$last_write" ]]; then
  echo "BLOCKED: Must re-Read $file_path after last edit before modifying again." >&2
  exit 2
fi

exit 0
