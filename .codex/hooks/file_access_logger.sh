#!/usr/bin/env bash
# PostToolUse: Log file access for Read/Write/Edit.
# Feeds the read-before-write guard.
set -uo pipefail

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')

case "$tool_name" in
  Read|Write|Edit) ;;
  *) exit 0 ;;
esac

file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // ""')
[[ -z "$file_path" || "$file_path" == "null" ]] && exit 0

state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state"
mkdir -p "$state_dir"
jsonl="$state_dir/file_access.jsonl"

ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
abs_path=$(realpath "$file_path" 2>/dev/null || echo "$file_path")

printf '{"ts":"%s","tool":"%s","path":"%s"}\n' "$ts" "$tool_name" "$abs_path" >> "$jsonl"

# Cap at 1000 entries
line_count=$(wc -l < "$jsonl" 2>/dev/null | tr -d ' ')
if [[ "$line_count" -gt 1000 ]]; then
  tail -1000 "$jsonl" > "$jsonl.tmp" && mv "$jsonl.tmp" "$jsonl"
fi

exit 0
