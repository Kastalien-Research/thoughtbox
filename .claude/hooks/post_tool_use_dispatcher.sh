#!/usr/bin/env bash
# PostToolUse dispatcher: reads stdin once, fans out to all hooks in parallel.
# Replaces 5 separate PostToolUse entries (5 fork/exec per tool call).
# Failures are logged to .claude/state/hook-errors.jsonl (non-blocking).
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
input_json=$(cat)

hooks=(
  "$project_dir/.claude/hooks/post_tool_use.sh"
  "$project_dir/.claude/hooks/specsuite_post_tool_use.sh"
  "$project_dir/.claude/hooks/track_file_access.sh"
  "$project_dir/.claude/hooks/assumption-tracker.sh"
  "$project_dir/.claude/hooks/bead_close_handoff.sh"
  "$project_dir/.claude/hooks/bead_workflow_state_writer.sh"
  "$project_dir/.claude/hooks/ulysses_state_writer.sh"
  "$project_dir/scripts/staged-hooks/probe_dispatcher.sh"
)

# Temp dir for capturing per-hook exit codes
err_dir=$(mktemp -d)
trap 'rm -rf "$err_dir"' EXIT

for hook in "${hooks[@]}"; do
  if [[ -x "$hook" ]]; then
    hook_base=$(basename "$hook")
    echo 137 > "$err_dir/$hook_base.exit"  # default: assume killed until proven otherwise
    (
      "$hook" <<< "$input_json"
      _rc=$?
      echo "$_rc" > "$err_dir/$hook_base.exit"
    ) &
  fi
done

wait

# Aggregate failures to hook-errors.jsonl
error_log="$project_dir/.claude/state/hook-errors.jsonl"
mkdir -p "$(dirname "$error_log")"
ts=$(date -u +%FT%TZ)
for exitfile in "$err_dir"/*.exit; do
  [[ -f "$exitfile" ]] || continue
  code=$(cat "$exitfile")
  if [[ "$code" != "0" ]]; then
    hook_name=$(basename "$exitfile" .exit)
    printf '{"ts":"%s","hook":"%s","exit_code":%s}\n' "$ts" "$hook_name" "$code" >> "$error_log"
  fi
done

# Rotate error log (cap at 500 entries, locked against concurrent dispatchers)
(
  flock -x 200
  if [[ -f "$error_log" ]] && [[ $(wc -l < "$error_log") -gt 500 ]]; then
    tail -500 "$error_log" > "$error_log.tmp"
    mv "$error_log.tmp" "$error_log"
  fi
) 200>"$error_log.lock"

exit 0
