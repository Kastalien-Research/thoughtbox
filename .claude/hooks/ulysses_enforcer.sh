#!/usr/bin/env bash
# PreToolUse: BLOCK when Ulysses REFLECT is required.
# This ONLY handles the escalation circuit breaker.
# The baseline bead workflow is in bead_workflow_enforcer.sh.
set -euo pipefail

ulysses_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/ulysses"
bead_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/bead-workflow"

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

# Allow: reflect commands, bd show/notes, git status
if [[ "$tool_name" == "Bash" ]]; then
  if [[ "$command" == *"ulysses"* && "$command" == *"reflect"* ]] \
     || [[ "$command" == *"thoughtbox_gateway"* && "$command" == *"reflect"* ]] \
     || [[ "$command" == *"bd show"* || "$command" == *"bd update"*"--notes"* ]] \
     || [[ "$command" == *"git status"* || "$command" == *"git diff"* ]]; then
    exit 0
  fi
fi

# Allow Skill tool (might be invoking ulysses-protocol skill)
if [[ "$tool_name" == "Skill" ]]; then
  exit 0
fi

bead_id="unknown"
count=0
if [[ -f "$bead_state_dir/current-bead.json" ]]; then
  bead_id=$(jq -r '.bead_id // "unknown"' "$bead_state_dir/current-bead.json")
  count=$(jq -r '.surprise_count // 0' "$bead_state_dir/current-bead.json")
fi

echo "BLOCKED: REFLECT REQUIRED (${count} consecutive surprises on ${bead_id})." >&2
echo "You MUST run Ulysses REFLECT before any further work." >&2
echo "After REFLECT completes, the reflect-required sentinel is cleared." >&2
exit 1
