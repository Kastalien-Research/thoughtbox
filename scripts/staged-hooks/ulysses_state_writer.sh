#!/usr/bin/env bash
# PostToolUse: Write state for Ulysses escalation ONLY.
# This handles surprise counting and reflect-required sentinel.
# The baseline bead workflow is in bead_workflow_state_writer.sh.
#
# State files (in bead-workflow dir — shared with baseline):
#   current-bead.json  — reads surprise_count, writes updates
#
# State files (in ulysses dir — escalation only):
#   reflect-required   — sentinel: 2+ surprises, must REFLECT
set -uo pipefail

bead_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/bead-workflow"
ulysses_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/ulysses"
mkdir -p "$ulysses_state_dir"

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)
command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)
stdout=$(echo "$input_json" | jq -r '.tool_response.stdout // empty' 2>/dev/null)
exit_code=$(echo "$input_json" | jq -r '.tool_response.exit_code // 0' 2>/dev/null)

# -------------------------------------------------------
# Event: command failure while bead is in_progress
# Counts as a surprise (unexpected outcome).
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" && -f "$bead_state_dir/current-bead.json" ]]; then
  is_failure=false

  # Explicit non-zero exit (exclude info commands)
  if [[ "$exit_code" != "0" ]]; then
    if [[ "$command" != *"bd "* && "$command" != *"git status"* \
       && "$command" != *"git diff"* && "$command" != *"git log"* \
       && "$command" != *"--help"* && "$command" != *"trash "* ]]; then
      is_failure=true
    fi
  fi

  # vitest exits 0 but reports FAIL
  if [[ "$command" == *"vitest"* && "$stdout" == *"FAIL"* ]]; then
    is_failure=true
  fi

  # supabase db reset failure
  if [[ "$command" == *"supabase"* && "$command" == *"reset"* && "$exit_code" != "0" ]]; then
    is_failure=true
  fi

  if [[ "$is_failure" == "true" ]]; then
    tmp=$(mktemp)
    old_count=$(jq -r '.surprise_count // 0' "$bead_state_dir/current-bead.json")
    new_count=$((old_count + 1))
    jq --argjson c "$new_count" '.surprise_count = $c' \
      "$bead_state_dir/current-bead.json" > "$tmp"
    mv "$tmp" "$bead_state_dir/current-bead.json"

    if [[ "$new_count" -ge 2 ]]; then
      touch "$ulysses_state_dir/reflect-required"
    fi
  fi
fi

# -------------------------------------------------------
# Event: REFLECT completed
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" ]]; then
  if [[ "$command" == *"ulysses"* && "$command" == *"reflect"* ]] \
     || [[ "$command" == *"thoughtbox_gateway"* && "$command" == *"reflect"* ]]; then
    rm -f "$ulysses_state_dir/reflect-required"
    if [[ -f "$bead_state_dir/current-bead.json" ]]; then
      tmp=$(mktemp)
      jq '.surprise_count = 0' "$bead_state_dir/current-bead.json" > "$tmp"
      mv "$tmp" "$bead_state_dir/current-bead.json"
    fi
  fi
fi

exit 0
