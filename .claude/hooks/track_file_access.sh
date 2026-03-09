#!/usr/bin/env bash
###
# File Access Tracker Hook
# Called from post_tool_use to track which files agents access
# Used by pattern detector to identify coverage gaps
###

set -euo pipefail

# Read JSON input
input_json="$(cat)"

# Extract tool info (Claude Code hook schema)
tool_name="$(echo "$input_json" | jq -r '.tool_name // "unknown"')"
tool_input="$(echo "$input_json" | jq -c '.tool_input // {}')"
hook_event="$(echo "$input_json" | jq -r '.hook_event_name // ""')"

# State directory
STATE_DIR=".claude/state"
mkdir -p "$STATE_DIR"

ACCESS_LOG="$STATE_DIR/file_access.log"
ACCESS_JSONL="$STATE_DIR/file_access.jsonl"
ERROR_LOG="$STATE_DIR/errors.log"

# Track file reads/writes (best-effort across tool schemas)
extract_file_path() {
  echo "$tool_input" | jq -r '
    .file_path // .path // .target_file // .target_path // .target_notebook // .notebook_path // .filePath // ""
  ' 2>/dev/null || echo ""
}

canonical_path() {
  local input_path="$1"
  python3 - "$input_path" <<'PY' || echo "$input_path"
import os, sys
path = sys.argv[1]
print(os.path.abspath(path))
PY
}

case "$tool_name" in
  "Read"|"Write"|"Edit"|"MultiEdit")
    file_path="$(extract_file_path)"

    if [[ -n "$file_path" && "$file_path" != "null" ]]; then
      timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
      abs_path="$(canonical_path "$file_path")"

      echo "[$timestamp] $abs_path" >> "$ACCESS_LOG"
      # Keep log manageable (last 500 entries)
      if [[ $(wc -l < "$ACCESS_LOG") -gt 500 ]]; then
        tail -500 "$ACCESS_LOG" > "$ACCESS_LOG.tmp"
        mv "$ACCESS_LOG.tmp" "$ACCESS_LOG"
      fi

      # Structured JSONL event for downstream guards
      echo "{\"ts\":\"$timestamp\",\"tool\":\"$tool_name\",\"path\":\"$abs_path\"}" >> "$ACCESS_JSONL"
      if [[ $(wc -l < "$ACCESS_JSONL") -gt 1000 ]]; then
        tail -1000 "$ACCESS_JSONL" > "$ACCESS_JSONL.tmp"
        mv "$ACCESS_JSONL.tmp" "$ACCESS_JSONL"
      fi
    fi
    ;;
esac

# Track errors (for repeated issue detection)
# - Prefer PostToolUseFailure.error
# - Otherwise check tool_response.isError (agent-sdk compatible)
is_error="false"
error_msg=""

if [[ "$hook_event" == "PostToolUseFailure" ]]; then
  is_error="true"
  error_msg="$(echo "$input_json" | jq -r '.error // "Unknown error"' 2>/dev/null || echo "Unknown error")"
else
  is_error="$(echo "$input_json" | jq -r '.tool_response.isError // false' 2>/dev/null || echo "false")"
  if [[ "$is_error" == "true" ]]; then
    error_msg="$(echo "$input_json" | jq -r '.tool_response.content // .tool_response.error // "Unknown error"' 2>/dev/null || echo "Unknown error")"
  fi
fi

if [[ "$is_error" == "true" ]]; then
  # Normalize error message (remove specifics like line numbers, IDs)
  normalized_error="$(echo "$error_msg" | sed -E 's/[0-9]+/N/g; s/"[^"]*"/"STR"/g' | head -c 200)"

  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "[$timestamp] $normalized_error" >> "$ERROR_LOG"

  # Keep log manageable
  if [[ $(wc -l < "$ERROR_LOG") -gt 200 ]]; then
    tail -200 "$ERROR_LOG" > "$ERROR_LOG.tmp"
    mv "$ERROR_LOG.tmp" "$ERROR_LOG"
  fi
fi

# Silent exit (no output to agent)
exit 0
