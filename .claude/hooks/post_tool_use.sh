#!/usr/bin/env bash
# PostToolUse: File access tracking + tool receipt writing.
# File access log feeds the read-before-write guard in pre_tool_use.sh.
# Receipts feed Ulysses surprise detection and tool reliability tracking.
set -uo pipefail

state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state"
mkdir -p "$state_dir"

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')

# ── FILE ACCESS TRACKING ──────────────────────────────────────────
case "$tool_name" in
  Read|Write|Edit)
    file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // ""')
    if [[ -n "$file_path" && "$file_path" != "null" ]]; then
      ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
      abs_path=$(python3 -c "import os,sys; print(os.path.abspath(sys.argv[1]))" \
        "$file_path" 2>/dev/null || echo "$file_path")

      jsonl="$state_dir/file_access.jsonl"
      printf '{"ts":"%s","tool":"%s","path":"%s"}\n' "$ts" "$tool_name" "$abs_path" >> "$jsonl"

      # Cap at 1000 entries
      line_count=$(wc -l < "$jsonl" 2>/dev/null || echo 0)
      if [[ "$line_count" -gt 1000 ]]; then
        tail -1000 "$jsonl" > "$jsonl.tmp" && mv "$jsonl.tmp" "$jsonl"
      fi
    fi
    ;;
esac

# ── RECEIPT WRITING ───────────────────────────────────────────────
case "$tool_name" in
  Bash|Edit|Write) ;;
  *) exit 0 ;;
esac

receipts_dir="$state_dir/receipts"
mkdir -p "$receipts_dir"
ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)

if [[ "$tool_name" == "Bash" ]]; then
  command=$(echo "$input_json" | jq -r '.tool_input.command // ""')
  exit_code=$(echo "$input_json" | jq -r '.tool_response.exit_code // 0')

  if [[ "$exit_code" == "0" ]]; then
    match=true
    expected="exit_code=0"
    actual="exit_code=0"
    residual=""
  else
    match=false
    expected="exit_code=0"
    actual="exit_code=${exit_code}"
    residual=$(echo "$input_json" | jq -r '.tool_response.stdout // ""' | head -c 200)
  fi

  jq -n \
    --arg tool "$tool_name" --arg cmd "$command" \
    --arg expected "$expected" --arg actual "$actual" \
    --argjson match "$match" --arg residual "$residual" --arg ts "$ts" \
    '{tool:$tool,command:$cmd,expected:$expected,actual:$actual,match:$match,residual:$residual,ts:$ts}' \
    > "$receipts_dir/latest.json"

elif [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // ""')

  if [[ -n "$file_path" && -f "$file_path" ]]; then
    match=true
    actual="file_exists=true"
  else
    match=false
    actual="file_exists=false"
  fi

  jq -n \
    --arg tool "$tool_name" --arg file "$file_path" \
    --arg expected "file_exists=true" --arg actual "$actual" \
    --argjson match "$match" --arg ts "$ts" \
    '{tool:$tool,file:$file,expected:$expected,actual:$actual,match:$match,ts:$ts}' \
    > "$receipts_dir/latest.json"
fi

# Append to history (capped at 200)
if [[ -f "$receipts_dir/latest.json" ]]; then
  cat "$receipts_dir/latest.json" >> "$receipts_dir/history.jsonl"
  line_count=$(wc -l < "$receipts_dir/history.jsonl" 2>/dev/null || echo 0)
  if [[ "$line_count" -gt 200 ]]; then
    tail -200 "$receipts_dir/history.jsonl" > "$receipts_dir/history.jsonl.tmp"
    mv "$receipts_dir/history.jsonl.tmp" "$receipts_dir/history.jsonl"
  fi
fi

exit 0
