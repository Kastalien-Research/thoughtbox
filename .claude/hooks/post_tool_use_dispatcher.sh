#!/usr/bin/env bash
# PostToolUse dispatcher: reads stdin once, fans out to all hooks in parallel.
# Replaces 5 separate PostToolUse entries (5 fork/exec per tool call).
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
input_json=$(cat)

hooks=(
  "$project_dir/.claude/hooks/post_tool_use.sh"
  "$project_dir/.claude/hooks/specsuite_post_tool_use.sh"
  "$project_dir/.claude/hooks/track_file_access.sh"
  "$project_dir/.claude/hooks/memory_pattern_detector.sh"
  "$project_dir/.claude/hooks/assumption-tracker.sh"
)

for hook in "${hooks[@]}"; do
  if [[ -x "$hook" ]]; then
    echo "$input_json" | "$hook" &
  fi
done

wait
exit 0
