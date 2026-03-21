#!/usr/bin/env bash
# PostToolUse: Write state for the baseline bead workflow (steps 1-7).
# This is NOT Ulysses. This is the standard process for every bead.
# Ulysses escalation is handled by ulysses_state_writer.sh separately.
#
# State files:
#   current-bead.json        — claimed bead, hypothesis flag
#   pending-validation.json  — exists after bd close until user confirms
#   tests-passed-since-edit  — sentinel: tests ran clean after last code change
set -uo pipefail

state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/bead-workflow"
mkdir -p "$state_dir"

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)
command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)
stdout=$(echo "$input_json" | jq -r '.tool_response.stdout // empty' 2>/dev/null)
exit_code=$(echo "$input_json" | jq -r '.tool_response.exit_code // 0' 2>/dev/null)
file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# -------------------------------------------------------
# Step 1: bead claimed (bd update --claim)
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" && "$command" == *"bd update"* && "$command" == *"--claim"* ]]; then
  bead_id=$(echo "$command" | grep -oE 'thoughtbox-[a-z0-9.]+' | head -1)
  if [[ -n "$bead_id" && ("$stdout" == *"Updated"* || "$stdout" == *"updated"*) ]]; then
    (
      flock -x 200
      jq -n \
        --arg id "$bead_id" \
        --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '{bead_id: $id, claimed_at: $t, hypothesis_stated: false}' \
        > "$state_dir/current-bead.json"
    ) 200>"$state_dir/current-bead.json.lock"
    rm -f "$state_dir/tests-passed-since-edit"
  fi
fi

# -------------------------------------------------------
# Step 2: hypothesis recorded (bd update --notes)
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" && "$command" == *"bd update"* && "$command" == *"--notes"* ]]; then
  if [[ -f "$state_dir/current-bead.json" ]]; then
    (
      flock -x 200
      tmp=$(mktemp)
      jq '.hypothesis_stated = true' "$state_dir/current-bead.json" > "$tmp"
      mv "$tmp" "$state_dir/current-bead.json"
    ) 200>"$state_dir/current-bead.json.lock"
  fi
fi

# -------------------------------------------------------
# Step 3: code changed (Edit or Write to src/ or migrations/)
# -------------------------------------------------------
if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  if [[ "$file_path" == */src/* || "$file_path" == */supabase/migrations/* ]]; then
    rm -f "$state_dir/tests-passed-since-edit"
  fi
fi

# -------------------------------------------------------
# Step 4: tests ran and passed
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" && "$command" == *"vitest"* && "$exit_code" == "0" ]]; then
  if [[ "$stdout" != *"FAIL"* ]]; then
    touch "$state_dir/tests-passed-since-edit"
  fi
fi
# Also accept tsc --noEmit passing as a test gate
if [[ "$tool_name" == "Bash" && "$command" == *"tsc"* && "$exit_code" == "0" ]]; then
  touch "$state_dir/tests-passed-since-edit"
fi

# -------------------------------------------------------
# Step 6: bead closed (bd close)
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" && "$command" == *"bd close"* ]]; then
  if [[ "$stdout" == *"Closed"* || "$stdout" == *"closed"* ]]; then
    bead_ids=$(echo "$command" | grep -oE 'thoughtbox-[a-z0-9.]+' | tr '\n' ' ')
    bead_count=$(echo "$command" | grep -oEc 'thoughtbox-[a-z0-9.]+')
    (
      flock -x 200
      jq -n \
        --arg ids "$bead_ids" \
        --argjson count "${bead_count:-1}" \
        --arg t "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '{bead_ids: $ids, count: $count, closed_at: $t, validated: false}' \
        > "$state_dir/pending-validation.json"
    ) 200>"$state_dir/pending-validation.json.lock"
    rm -f "$state_dir/current-bead.json"
  fi
fi

# -------------------------------------------------------
# Step 7: validation confirmed by user
# -------------------------------------------------------
if [[ "$tool_name" == "Bash" && "$command" == *"validation-confirmed"* ]]; then
  rm -f "$state_dir/pending-validation.json"
fi

exit 0
