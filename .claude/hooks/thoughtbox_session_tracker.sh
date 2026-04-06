#!/usr/bin/env bash
# PostToolUse hook: track active Thoughtbox session ID and emit audited run binding.
# Fires on thoughtbox_execute calls, extracts the Thoughtbox sessionId, writes to state,
# and sends a non-blocking OTLP binding event containing both external IDs.
# Must never block the agent — always exits 0.

set -uo pipefail

input_json=$(cat)
state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state"
mkdir -p "$state_dir"

claude_session_id=$(echo "$input_json" | jq -r '.session_id // empty' 2>/dev/null || true)

# Extract sessionId or closedSessionId from the tool result
thoughtbox_session_id=$(echo "$input_json" \
    | jq -r '
        .tool_result.content // .tool_result // .
        | if type == "array" then .[0].text // .[0] else . end
        | if type == "string" then (try fromjson catch .) else . end
        | .result.sessionId // .result.closedSessionId // .sessionId // .closedSessionId // .session_id // empty
    ' 2>/dev/null || true)

if [[ -n "$thoughtbox_session_id" && "$thoughtbox_session_id" != "null" ]]; then
    echo "$thoughtbox_session_id" > "$state_dir/active_thoughtbox_session"
fi

build_otlp_binding_payload() {
    local claude_session="$1"
    local tb_session="$2"
    local ts
    ts=$(python3 - <<'PY'
from datetime import datetime, timezone
print(datetime.now(timezone.utc).isoformat().replace("+00:00","Z"))
PY
)

    jq -n \
      --arg session_id "$claude_session" \
      --arg tb_session_id "$tb_session" \
      --arg timestamp "$ts" \
      '{
        resourceLogs: [{
          resource: {
            attributes: [
              { key: "session.id", value: { stringValue: $session_id } },
              { key: "service.name", value: { stringValue: "thoughtbox-hook" } }
            ]
          },
          scopeLogs: [{
            logRecords: [{
              body: { stringValue: "thoughtbox.run_binding" },
              severityText: "INFO",
              attributes: [
                { key: "event.name", value: { stringValue: "thoughtbox.run_binding" } },
                { key: "mcp.session_id", value: { stringValue: $session_id } },
                { key: "thoughtbox.session_id", value: { stringValue: $tb_session_id } },
                { key: "binding.source", value: { stringValue: "thoughtbox_session_tracker" } },
                { key: "tool.timestamp", value: { stringValue: $timestamp } }
              ]
            }]
          }]
        }]
      }'
}

send_otlp_binding_async() {
    local claude_session="$1"
    local tb_session="$2"
    local endpoint="${OTEL_EXPORTER_OTLP_ENDPOINT:-}"
    local headers_env="${OTEL_EXPORTER_OTLP_HEADERS:-}"

    if [[ -z "$endpoint" || -z "$claude_session" || -z "$tb_session" ]]; then
      return 0
    fi

    local payload
    payload=$(build_otlp_binding_payload "$claude_session" "$tb_session")
    local logs_endpoint="${endpoint%/}/v1/logs"
    local -a curl_args=("-sS" "-X" "POST" "$logs_endpoint" "-H" "Content-Type: application/json" "-d" "$payload")

    if [[ -n "$headers_env" ]]; then
      while IFS= read -r header || [[ -n "$header" ]]; do
        [[ -n "$header" ]] && curl_args+=("-H" "$header")
      done < <(printf '%s\n' "$headers_env" | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sed 's/=/: /')
    fi

    curl "${curl_args[@]}" >/dev/null 2>&1 &
}

if [[ -n "$thoughtbox_session_id" && "$thoughtbox_session_id" != "null" ]]; then
    send_otlp_binding_async "$claude_session_id" "$thoughtbox_session_id"
fi

exit 0
