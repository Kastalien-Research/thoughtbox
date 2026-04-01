#!/usr/bin/env bash
# PreToolUse: BLOCK when Ulysses REFLECT is required.
set -euo pipefail

ulysses_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/ulysses"

# If no reflect-required sentinel, pass through
[[ -f "$ulysses_state_dir/reflect-required" ]] || exit 0

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)
command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Allow: reading files, asking user
if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" || "$tool_name" == "Grep" \
   || "$tool_name" == "AskUserQuestion" ]]; then
  exit 0
fi

# Allow: reflect commands, git status
if [[ "$tool_name" == "Bash" ]]; then
  if [[ "$command" == *"ulysses"* && "$command" == *"reflect"* ]] \
     || [[ "$command" == *"thoughtbox_gateway"* && "$command" == *"reflect"* ]] \
     || [[ "$command" == *"git status"* || "$command" == *"git diff"* ]]; then
    exit 0
  fi
fi

# Allow Skill tool (might be invoking ulysses-protocol skill)
if [[ "$tool_name" == "Skill" ]]; then
  exit 0
fi

surprise_file="$ulysses_state_dir/surprise_count.json"
count=0
if [[ -f "$surprise_file" ]]; then
  count=$(jq -r '.count // 0' "$surprise_file" 2>/dev/null || echo 0)
fi

echo "BLOCKED: REFLECT REQUIRED (${count} consecutive surprises)." >&2
echo "You MUST run Ulysses REFLECT before any further work." >&2
echo "After REFLECT completes, the reflect-required sentinel is cleared." >&2
exit 1
