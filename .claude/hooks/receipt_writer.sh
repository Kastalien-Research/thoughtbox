#!/usr/bin/env bash
# PostToolUse: Write post-action receipts for Bash/Edit/Write tool calls.
# Captures tool outcome, compares expected vs actual state, writes receipt JSON.
# Receipts feed into: (1) Ulysses surprise detection, (2) tool reliability tracking.
#
# Output: .claude/state/receipts/latest.json (overwritten per tool call)
#         .claude/state/receipts/history.jsonl (append-only, capped at 200)
set -uo pipefail

receipts_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/receipts"
mkdir -p "$receipts_dir"

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)

# Only process Bash, Edit, and Write tools
case "$tool_name" in
  Bash|Edit|Write) ;;
  *) exit 0 ;;
esac

ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)

if [[ "$tool_name" == "Bash" ]]; then
  command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)
  exit_code=$(echo "$input_json" | jq -r '.tool_response.exit_code // 0' 2>/dev/null)
  stdout_snippet=$(echo "$input_json" | jq -r '.tool_response.stdout // empty' 2>/dev/null | head -c 500)

  if [[ "$exit_code" == "0" ]]; then
    match=true
    expected="exit_code=0"
    actual="exit_code=0"
    residual=""
  else
    match=false
    expected="exit_code=0"
    actual="exit_code=${exit_code}"
    residual=$(echo "$stdout_snippet" | head -c 200)
  fi

  jq -n \
    --arg tool "$tool_name" \
    --arg cmd "$command" \
    --arg expected "$expected" \
    --arg actual "$actual" \
    --argjson match "$match" \
    --arg residual "$residual" \
    --arg ts "$ts" \
    '{toolName: $tool, command: $cmd, expected: $expected, actual: $actual, match: $match, residual: $residual, timestamp: $ts}' \
    > "$receipts_dir/latest.json"

elif [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
  tool_response=$(echo "$input_json" | jq -r '.tool_response // empty' 2>/dev/null)

  # Verify file exists after write/edit
  if [[ -n "$file_path" && -f "$file_path" ]]; then
    match=true
    actual="file_exists=true"
  else
    match=false
    actual="file_exists=false"
  fi

  jq -n \
    --arg tool "$tool_name" \
    --arg file "$file_path" \
    --arg expected "file_exists=true" \
    --arg actual "$actual" \
    --argjson match "$match" \
    --arg ts "$ts" \
    '{toolName: $tool, filePath: $file, expected: $expected, actual: $actual, match: $match, timestamp: $ts}' \
    > "$receipts_dir/latest.json"
fi

# Append to history (capped at 200 entries)
if [[ -f "$receipts_dir/latest.json" ]]; then
  cat "$receipts_dir/latest.json" >> "$receipts_dir/history.jsonl"

  # Rotate history
  if [[ -f "$receipts_dir/history.jsonl" ]]; then
    line_count=$(wc -l < "$receipts_dir/history.jsonl")
    if [[ "$line_count" -gt 200 ]]; then
      tail -200 "$receipts_dir/history.jsonl" > "$receipts_dir/history.jsonl.tmp"
      mv "$receipts_dir/history.jsonl.tmp" "$receipts_dir/history.jsonl"
    fi
  fi
fi

exit 0
