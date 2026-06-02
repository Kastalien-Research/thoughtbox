#!/usr/bin/env bash
# PostToolUse: Capture every tool call as an OTLP log event.
# Sends to the Thoughtbox OTLP endpoint asynchronously (never blocks the agent).
set -uo pipefail

input_json=$(cat)

endpoint="${OTEL_EXPORTER_OTLP_ENDPOINT:-}"
[[ -z "$endpoint" ]] && exit 0

headers_env="${OTEL_EXPORTER_OTLP_HEADERS:-}"

tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
session_id=$(echo "$input_json" | jq -r '.session_id // ""')
file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Truncate tool input/result to avoid oversized payloads
tool_input=$(echo "$input_json" | jq -c '.tool_input // {}' | head -c 4096)
tool_result=$(echo "$input_json" | jq -c '.tool_result // .tool_response // {}' | head -c 4096)

time_nanos=$(date +%s)000000000

payload=$(jq -n \
  --arg tool "$tool_name" \
  --arg session "$session_id" \
  --arg file "$file_path" \
  --arg input "$tool_input" \
  --arg result "$tool_result" \
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
          body: { stringValue: ("tool." + $tool) },
          severityText: "INFO",
          attributes: [
            { key: "tool.name", value: { stringValue: $tool } },
            { key: "tool.input", value: { stringValue: $input } },
            { key: "tool.result", value: { stringValue: $result } },
            { key: "file.path", value: { stringValue: $file } }
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
