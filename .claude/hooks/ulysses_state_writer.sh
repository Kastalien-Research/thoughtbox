#!/usr/bin/env bash
# PostToolUse: Write state for Ulysses escalation.
# Tracks surprise count and reflect-required sentinel.
#
# State files:
#   ulysses/surprise_count.json — surprise counter
#   ulysses/reflect-required    — sentinel: 2+ surprises, must REFLECT
set -uo pipefail

ulysses_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/ulysses"
mkdir -p "$ulysses_state_dir"

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)
command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)
stdout=$(echo "$input_json" | jq -r '.tool_response.stdout // empty' 2>/dev/null)
exit_code=$(echo "$input_json" | jq -r '.tool_response.exit_code // 0' 2>/dev/null)

surprise_file="$ulysses_state_dir/surprise_count.json"

# -------------------------------------------------------
# Event: command failure (counts as a surprise)
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" ]]; then
  is_failure=false

  # Explicit non-zero exit (exclude info commands)
  if [[ "$exit_code" != "0" ]]; then
    if [[ "$command" != *"git status"* && "$command" != *"git diff"* \
       && "$command" != *"git log"* && "$command" != *"--help"* \
       && "$command" != *"trash "* ]]; then
      is_failure=true
    fi
  fi

  # vitest exits 0 but reports FAIL
  if [[ "$command" == *"vitest"* && "$stdout" == *"FAIL"* ]]; then
    is_failure=true
  fi

  if [[ "$is_failure" == "true" ]]; then
    (
      flock -x 200
      if [[ -f "$surprise_file" ]]; then
        old_count=$(jq -r '.count // 0' "$surprise_file" 2>/dev/null || echo 0)
      else
        old_count=0
      fi
      new_count=$((old_count + 1))
      printf '{"count":%d,"last_ts":"%s"}\n' "$new_count" "$(date -u +%FT%TZ)" > "$surprise_file"

      if [[ "$new_count" -ge 2 ]]; then
        touch "$ulysses_state_dir/reflect-required"
      fi
    ) 200>"$surprise_file.lock"
  fi
fi

# -------------------------------------------------------
# Event: REFLECT completed
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" ]]; then
  if [[ "$command" == *"ulysses"* && "$command" == *"reflect"* ]] \
     || [[ "$command" == *"thoughtbox_gateway"* && "$command" == *"reflect"* ]]; then
    rm -f "$ulysses_state_dir/reflect-required"
    printf '{"count":0,"last_ts":"%s"}\n' "$(date -u +%FT%TZ)" > "$surprise_file" 2>/dev/null || true
  fi
fi

exit 0
