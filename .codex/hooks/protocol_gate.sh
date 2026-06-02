#!/usr/bin/env bash
# PreToolUse: Protocol enforcement gate.
# Calls Thoughtbox /protocol/enforcement before allowing Edit/Write/NotebookEdit.
# Blocks if an active Ulysses session needs REFLECT (S=2) or a Theseus scope violation.
# Fails open on timeout/error — never blocks the agent on network issues.
set -uo pipefail

input_json=$(cat)

endpoint="${THOUGHTBOX_URL:-http://localhost:1731}"
target_path=$(echo "$input_json" | jq -r '.tool_input.file_path // .tool_input.notebook_path // .tool_input.path // ""')

[[ -z "$target_path" || "$target_path" == "null" ]] && exit 0

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

response=$(curl -sS --max-time 5 \
  -X POST "${endpoint}/protocol/enforcement" \
  -H "Content-Type: application/json" \
  -d "$payload" 2>/dev/null) || exit 0

blocked=$(echo "$response" | jq -r '.blocked // false' 2>/dev/null || echo "false")

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
