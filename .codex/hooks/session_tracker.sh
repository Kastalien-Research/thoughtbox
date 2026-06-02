#!/usr/bin/env bash
# PostToolUse (thoughtbox_execute only): Track active Thoughtbox session ID
# and emit an OTLP binding event linking the Claude session to the Thoughtbox session.
set -uo pipefail

input_json=$(cat)

session_id=$(echo "$input_json" | jq -r '.session_id // ""')

# Extract Thoughtbox sessionId from the tool result
tb_session_id=$(echo "$input_json" \
  | jq -r '
      .tool_result.content // .tool_result // .tool_response // .
      | if type == "array" then .[0].text // .[0] else . end
      | if type == "string" then (try fromjson catch .) else . end
      | (.result | if type == "object" then (.sessionId // .closedSessionId) else null end)
        // .sessionId // .closedSessionId // .session_id // empty
  ' 2>/dev/null || true)

[[ -z "$tb_session_id" || "$tb_session_id" == "null" ]] && exit 0

# Persist to state for other hooks/tools to read
state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state"
mkdir -p "$state_dir"
echo "$tb_session_id" > "$state_dir/active_thoughtbox_session"

# Send OTLP binding event
endpoint="${OTEL_EXPORTER_OTLP_ENDPOINT:-}"
headers_env="${OTEL_EXPORTER_OTLP_HEADERS:-}"
[[ -z "$endpoint" || -z "$session_id" ]] && exit 0

time_nanos=$(date +%s)000000000

payload=$(jq -n \
  --arg session "$session_id" \
  --arg tb_session "$tb_session_id" \
  --arg time "$time_nanos" \
  '{
    resourceLogs: [{
      resource: {
        attributes: [
          { key: "service.name", value: { stringValue: "claude-code-plugin" } },
          { key: "session.id", value: { stringValue: $session } }
        ]
      },
      scopeLogs: [{
        logRecords: [{
          timeUnixNano: $time,
          body: { stringValue: "thoughtbox.run_binding" },
          severityText: "INFO",
          attributes: [
            { key: "event.name", value: { stringValue: "thoughtbox.run_binding" } },
            { key: "mcp.session_id", value: { stringValue: $session } },
            { key: "thoughtbox.session_id", value: { stringValue: $tb_session } }
          ]
        }]
      }]
    }]
  }')

logs_endpoint="${endpoint%/}/v1/logs"
curl_args=("-sS" "-X" "POST" "$logs_endpoint" "-H" "Content-Type: application/json" "-d" "$payload")

if [[ -n "$headers_env" ]]; then
  while IFS= read -r header; do
    [[ -n "$header" ]] && curl_args+=("-H" "$header")
  done < <(printf '%s\n' "$headers_env" | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sed 's/=/: /')
fi

curl "${curl_args[@]}" --max-time 5 >/dev/null 2>&1 &

exit 0
