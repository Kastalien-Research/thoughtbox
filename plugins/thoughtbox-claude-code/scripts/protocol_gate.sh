#!/usr/bin/env bash
# PreToolUse: Protocol enforcement gate.
# Calls Thoughtbox POST /protocol/enforcement before allowing Edit/Write/NotebookEdit.
# Blocks (exit 2) if an active Ulysses session needs REFLECT (S=2) or a
# Theseus test-lock/scope violation is detected.
#
# Availability posture: fails OPEN when enforcement is unreachable or
# unconfigured — but never silently. Exit 1 (non-blocking) with a stderr
# warning makes the fail-open observable to the user.
set -uo pipefail

input_json=$(cat)

target_path=$(echo "$input_json" | jq -r '.tool_input.file_path // .tool_input.notebook_path // .tool_input.path // ""')

[[ -z "$target_path" || "$target_path" == "null" ]] && exit 0

settings_local="${CLAUDE_PROJECT_DIR:-.}/.claude/settings.local.json"

# --- Resolve endpoint: explicit env override, then the config written by
# `thoughtbox init` (.claude/settings.local.json). No hardcoded default —
# an unconfigured gate warns loudly instead of probing the wrong server.
endpoint="${THOUGHTBOX_URL:-${OTEL_EXPORTER_OTLP_ENDPOINT:-}}"
if [[ -z "$endpoint" && -f "$settings_local" ]]; then
  endpoint=$(jq -r '.env.OTEL_EXPORTER_OTLP_ENDPOINT // empty' "$settings_local" 2>/dev/null || true)
  if [[ -z "$endpoint" ]]; then
    mcp_url=$(jq -r '.mcpServers.thoughtbox.url // empty' "$settings_local" 2>/dev/null || true)
    [[ -n "$mcp_url" ]] && endpoint="${mcp_url%%/mcp*}"
  fi
fi
endpoint="${endpoint%/}"

if [[ -z "$endpoint" ]]; then
  echo "thoughtbox protocol_gate: no Thoughtbox endpoint configured (set THOUGHTBOX_URL or run 'thoughtbox init'); protocol enforcement is OFF for this action — failing open" >&2
  exit 1
fi

# --- Resolve API key: explicit env, OTLP headers env, then init config.
api_key="${THOUGHTBOX_API_KEY:-}"
if [[ -z "$api_key" && -n "${OTEL_EXPORTER_OTLP_HEADERS:-}" ]]; then
  api_key=$(printf '%s' "$OTEL_EXPORTER_OTLP_HEADERS" | sed -n 's/.*Authorization=Bearer \([^,[:space:]]*\).*/\1/p')
fi
if [[ -z "$api_key" && -f "$settings_local" ]]; then
  api_key=$(jq -r '.env.OTEL_EXPORTER_OTLP_HEADERS // empty' "$settings_local" 2>/dev/null | sed -n 's/.*Authorization=Bearer \([^,[:space:]]*\).*/\1/p' || true)
  if [[ -z "$api_key" ]]; then
    api_key=$(jq -r '.mcpServers.thoughtbox.url // empty' "$settings_local" 2>/dev/null | sed -n 's/.*[?&]key=\([^&]*\).*/\1/p' || true)
  fi
fi

workspace_id="${THOUGHTBOX_WORKSPACE_ID:-}"

payload=$(jq -n \
  --argjson mutation true \
  --arg targetPath "$target_path" \
  --arg workspaceId "$workspace_id" \
  '{
    mutation: $mutation,
    targetPath: (if ($targetPath | length) > 0 then $targetPath else null end),
    workspaceId: (if ($workspaceId | length) > 0 then $workspaceId else null end)
  }')

curl_args=(-sS -f --max-time 5
  -X POST "${endpoint}/protocol/enforcement"
  -H "Content-Type: application/json"
  -d "$payload")
[[ -n "$api_key" ]] && curl_args+=(-H "Authorization: Bearer ${api_key}")

if ! response=$(curl "${curl_args[@]}" 2>/dev/null); then
  echo "thoughtbox protocol_gate: enforcement unreachable at ${endpoint}/protocol/enforcement (network error, auth rejection, or 5xx); protocol gates NOT enforced for this action — failing open" >&2
  exit 1
fi

if ! blocked=$(echo "$response" | jq -r '.blocked // false' 2>/dev/null); then
  echo "thoughtbox protocol_gate: unparseable enforcement response from ${endpoint}/protocol/enforcement; protocol gates NOT enforced for this action — failing open" >&2
  exit 1
fi

if [[ "$blocked" == "true" ]]; then
  reason=$(echo "$response" | jq -r '.reason // "Protocol enforcement blocked this action."' 2>/dev/null)
  protocol=$(echo "$response" | jq -r '.protocol // ""' 2>/dev/null)
  required_action=$(echo "$response" | jq -r '.required_action // ""' 2>/dev/null)

  msg="BLOCKED"
  [[ -n "$protocol" && "$protocol" != "null" ]] && msg="BLOCKED [$protocol]"
  msg="$msg: $reason"
  [[ -n "$required_action" && "$required_action" != "null" ]] && msg="$msg (required: $required_action)"

  echo "$msg" >&2
  exit 2
fi

exit 0
