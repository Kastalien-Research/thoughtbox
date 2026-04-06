#!/usr/bin/env bash
# PostToolUse: File access tracking + tool receipt writing + optional OTLP hook capture.
# File access log feeds the read-before-write guard in pre_tool_use.sh.
# Receipts feed Ulysses surprise detection and tool reliability tracking.
set -uo pipefail

state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state"
mkdir -p "$state_dir"

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
claude_session_id=$(echo "$input_json" | jq -r '.session_id // empty' 2>/dev/null || true)
active_thoughtbox_session=$(cat "$state_dir/active_thoughtbox_session" 2>/dev/null || true)

emit_hook_otlp_async() {
  local endpoint="${OTEL_EXPORTER_OTLP_ENDPOINT:-}"
  local headers_env="${OTEL_EXPORTER_OTLP_HEADERS:-}"
  [[ -z "$endpoint" || -z "$claude_session_id" ]] && return 0

  local tool_input tool_result tool_timestamp file_path payload logs_endpoint
  tool_input=$(echo "$input_json" | jq -c '.tool_input // {}')
  tool_result=$(echo "$input_json" | jq -c '.tool_response // .tool_result // {}')
  tool_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // empty')

  payload=$(jq -n \
    --arg session_id "$claude_session_id" \
    --arg tool_name "$tool_name" \
    --arg tool_input "$tool_input" \
    --arg tool_result "$tool_result" \
    --arg tool_timestamp "$tool_timestamp" \
    --arg file_path "$file_path" \
    --arg tb_session "$active_thoughtbox_session" '
    {
      resourceLogs: [{
        resource: {
          attributes: [
            { key: "session.id", value: { stringValue: $session_id } },
            { key: "service.name", value: { stringValue: "thoughtbox-hook" } }
          ]
        },
        scopeLogs: [{
          logRecords: [{
            body: { stringValue: "claude_code.hook_tool_result" },
            severityText: "INFO",
            attributes: (
              [
                { key: "event.name", value: { stringValue: "claude_code.hook_tool_result" } },
                { key: "tool.name", value: { stringValue: $tool_name } },
                { key: "tool.input", value: { stringValue: $tool_input } },
                { key: "tool.result", value: { stringValue: ($tool_result[0:4096]) } },
                { key: "tool.timestamp", value: { stringValue: $tool_timestamp } },
                { key: "connection_id", value: { stringValue: $session_id } }
              ]
              + (if $file_path != "" then [{ key: "file.path", value: { stringValue: $file_path } }] else [] end)
              + (if $tb_session != "" then [{ key: "thoughtbox.session_id", value: { stringValue: $tb_session } }] else [] end)
            )
          }]
        }]
      }]
    }')

  logs_endpoint="${endpoint%/}/v1/logs"
  local -a curl_args=("-sS" "-X" "POST" "$logs_endpoint" "-H" "Content-Type: application/json" "-d" "$payload")
  if [[ -n "$headers_env" ]]; then
    while IFS= read -r header; do
      [[ -n "$header" ]] && curl_args+=("-H" "$header")
    done < <(printf '%s' "$headers_env" | tr ',' '\n' | sed 's/^ *//;s/ *$//')
  fi

  curl "${curl_args[@]}" >/dev/null 2>&1 &
}

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

emit_hook_otlp_async

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
