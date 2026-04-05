#!/usr/bin/env bash
# PreToolUse: safety guards plus Thoughtbox-backed protocol enforcement.
set -euo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
tool_input=$(echo "$input_json" | jq -c '.tool_input // {}')

command=""
normalized_command=""
if [[ "$tool_name" == "Bash" ]]; then
  command=$(echo "$tool_input" | jq -r '.command // ""')
  normalized_command=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')
fi

block() {
  echo "BLOCKED: $1" >&2
  exit 2
}

normalize_target_path() {
  local raw_path="$1"
  if [[ -z "$raw_path" ]]; then
    return 0
  fi

  case "$raw_path" in
    "$project_dir"/*)
      printf '%s\n' "${raw_path#"$project_dir"/}"
      ;;
    *)
      printf '%s\n' "$raw_path"
      ;;
  esac
}

is_read_only_bash() {
  case "$normalized_command" in
    ""|\
    "pwd"|\
    "pwd "*|\
    "ls"|\
    "ls "*|\
    "cat "*|\
    "head "*|\
    "tail "*|\
    "wc "*|\
    "rg "*|\
    "grep "*|\
    "find "*|\
    "jq "*|\
    "sed -n "*|\
    "git status"*|\
    "git diff"*|\
    "git log"*|\
    "git show"*|\
    "git branch --show-current"*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_mutating_tool() {
  case "$tool_name" in
    Write|Edit|NotebookEdit)
      return 0
      ;;
    Bash)
      if is_read_only_bash; then
        return 1
      fi
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

resolve_workspace_id() {
  if [[ -n "${THOUGHTBOX_PROJECT:-}" ]]; then
    printf '%s\n' "$THOUGHTBOX_PROJECT"
    return 0
  fi

  if [[ -n "${THOUGHTBOX_WORKSPACE_ID:-}" ]]; then
    printf '%s\n' "$THOUGHTBOX_WORKSPACE_ID"
    return 0
  fi

  basename "$project_dir"
}

resolve_protocol_enforcement_url() {
  if [[ -n "${THOUGHTBOX_PROTOCOL_ENFORCEMENT_URL:-}" ]]; then
    printf '%s\n' "$THOUGHTBOX_PROTOCOL_ENFORCEMENT_URL"
    return 0
  fi

  if [[ -n "${THOUGHTBOX_URL:-}" ]]; then
    printf '%s\n' "${THOUGHTBOX_URL%/}/protocol/enforcement"
    return 0
  fi

  local config_path="$project_dir/.mcp.json"
  if [[ -f "$config_path" ]]; then
    local mcp_url
    mcp_url=$(jq -r '.mcpServers.thoughtbox.url // ""' "$config_path" 2>/dev/null || echo "")
    if [[ -n "$mcp_url" ]]; then
      printf '%s\n' "${mcp_url%/mcp}/protocol/enforcement"
      return 0
    fi
  fi

  printf '%s\n' "http://localhost:1731/protocol/enforcement"
}

run_protocol_enforcement() {
  local mutation="$1"
  local target_path="$2"

  if [[ "$mutation" != "true" ]]; then
    return 0
  fi

  local endpoint
  endpoint=$(resolve_protocol_enforcement_url)
  local workspace_id
  workspace_id=$(resolve_workspace_id)

  local payload
  payload=$(jq -nc \
    --argjson mutation true \
    --arg targetPath "$target_path" \
    --arg workspaceId "$workspace_id" \
    '{
      mutation: $mutation,
      targetPath: (if ($targetPath | length) > 0 then $targetPath else null end),
      workspaceId: (if ($workspaceId | length) > 0 then $workspaceId else null end)
    }')

  local response
  if ! response=$(curl -fsS --max-time 2 \
    -H "Content-Type: application/json" \
    -H "Connection: close" \
    -d "$payload" \
    "$endpoint" 2>/dev/null); then
    return 0
  fi

  local blocked reason protocol required_action
  blocked=$(echo "$response" | jq -r '.blocked // false' 2>/dev/null || echo false)
  if [[ "$blocked" != "true" ]]; then
    return 0
  fi

  reason=$(echo "$response" | jq -r '.reason // "Protocol enforcement blocked this action."' 2>/dev/null || echo "Protocol enforcement blocked this action.")
  protocol=$(echo "$response" | jq -r '.protocol // ""' 2>/dev/null || echo "")
  required_action=$(echo "$response" | jq -r '.required_action // ""' 2>/dev/null || echo "")

  if [[ -n "$protocol" ]]; then
    echo "BLOCKED [$protocol]: $reason" >&2
  else
    echo "BLOCKED: $reason" >&2
  fi

  if [[ -n "$required_action" ]]; then
    echo "Required action: $required_action" >&2
  fi

  exit 2
}

# ── GUARD 1: Dangerous rm ──────────────────────────────────────────
if [[ "$tool_name" == "Bash" ]]; then
  if echo "$normalized_command" | grep -qE '\brm\s+.*-[a-z]*r[a-z]*f' || \
     echo "$normalized_command" | grep -qE '\brm\s+.*-[a-z]*f[a-z]*r' || \
     echo "$normalized_command" | grep -qE '\brm\s+--recursive\s+--force' || \
     echo "$normalized_command" | grep -qE '\brm\s+--force\s+--recursive'; then
    block "rm -rf is prohibited. Use 'trash' for recoverable deletion."
  fi
fi

# ── GUARD 2: Protocol-aware enforcement ────────────────────────────
mutation=false
if is_mutating_tool; then
  mutation=true
fi

target_path=""
if [[ "$tool_name" == "Write" || "$tool_name" == "Edit" || "$tool_name" == "NotebookEdit" ]]; then
  target_path=$(normalize_target_path "$(echo "$tool_input" | jq -r '.file_path // .notebook_path // ""')")
fi

run_protocol_enforcement "$mutation" "$target_path"

# ── GUARD 3: Read-before-write ─────────────────────────────────────
# Require that a file has been Read before it can be edited.
# Tracked by post_tool_use.sh writing to file_access.jsonl.
if [[ "${CC_DISABLE_READ_GUARD:-0}" != "1" ]]; then
  if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
    file_path=$(echo "$tool_input" | jq -r '.file_path // ""')

    if [[ -n "$file_path" && -f "$file_path" ]]; then
      access_log="${project_dir}/.claude/state/file_access.jsonl"

      if [[ ! -f "$access_log" ]]; then
        block "Must Read $file_path before modifying it (no access log)."
      fi

      abs_path=$(python3 -c "import os,sys; print(os.path.abspath(sys.argv[1]))" \
        "$file_path" 2>/dev/null || echo "$file_path")

      last_read=$(jq -sr --arg p "$abs_path" \
        'map(select(.path == $p and .tool == "Read")) | .[-1].ts // ""' \
        "$access_log" 2>/dev/null || echo "")

      if [[ -z "$last_read" ]]; then
        block "Must Read $file_path before modifying it."
      fi

      last_write=$(jq -sr --arg p "$abs_path" \
        'map(select(.path == $p and (.tool == "Write" or .tool == "Edit"))) | .[-1].ts // ""' \
        "$access_log" 2>/dev/null || echo "")

      if [[ -n "$last_write" && "$last_read" < "$last_write" ]]; then
        block "Must re-Read $file_path after last edit before modifying again."
      fi
    fi
  fi
fi

# ── GUARD 4: HDD workflow enforcement ─────────────────────────────
# No code changes to src/ or supabase/migrations/ without an active
# HDD session that has hypotheses recorded. Prevents skipping the
# mandatory HDD workflow for new features and architectural decisions.
hdd_state="${project_dir}/.hdd/state.json"

if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  _fp=$(echo "$tool_input" | jq -r '.file_path // ""')
  if [[ "$_fp" == */src/* || "$_fp" == */cli/src/* || "$_fp" == */supabase/migrations/* ]]; then
    if [[ ! -f "$hdd_state" ]]; then
      block "No HDD session active. Run /hdd to stage an ADR before making code changes."
    fi

    # Check HDD session has hypotheses
    hyp_count=$(jq -r '.hypotheses | length // 0' "$hdd_state" 2>/dev/null || echo 0)
    if [[ "$hyp_count" -eq 0 ]]; then
      block "HDD session has no hypotheses. Record hypotheses before making code changes."
    fi

    # Check HDD session is current (updated within last 7 days)
    hdd_updated=$(jq -r '.updated_at // ""' "$hdd_state" 2>/dev/null || echo "")
    if [[ -n "$hdd_updated" ]]; then
      # Parse ISO 8601 date portably (handles both macOS and Linux, with/without ms)
      hdd_epoch=$(python3 -c "
import sys, datetime
ts = sys.argv[1]
for fmt in ('%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S%z'):
    try:
        dt = datetime.datetime.strptime(ts, fmt)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        print(int(dt.timestamp()))
        break
    except ValueError:
        continue
else:
    print(0)
" "$hdd_updated" 2>/dev/null || echo 0)
      now_epoch=$(date +%s)
      age_days=$(( (now_epoch - hdd_epoch) / 86400 ))
      if [[ "$age_days" -gt 7 ]]; then
        hdd_title=$(jq -r '.title // "unknown"' "$hdd_state" 2>/dev/null)
        block "HDD session '${hdd_title}' is ${age_days} days old (last updated: ${hdd_updated}). Start a new HDD session for current work: /hdd"
      fi
    fi
  fi
fi

# ── GUARD 5: Ulysses reflect-required ─────────────────────────────
# When Ulysses surprise count hits S=2, block everything except
# read-only tools and the reflect operation itself.
ulysses_state_dir="${project_dir}/.claude/state/ulysses"

if [[ -f "$ulysses_state_dir/reflect-required" ]]; then
  if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" || "$tool_name" == "Grep" \
     || "$tool_name" == "AskUserQuestion" ]]; then
    exit 0
  fi
  if [[ "$tool_name" == "Bash" ]]; then
    _cmd=$(echo "$tool_input" | jq -r '.command // ""')
    if [[ "$_cmd" == *"ulysses"* && "$_cmd" == *"reflect"* ]] \
       || [[ "$_cmd" == *"git status"* || "$_cmd" == *"git diff"* ]]; then
      exit 0
    fi
  fi
  if [[ "$tool_name" == "Skill" ]]; then
    exit 0
  fi
  block "REFLECT REQUIRED. Ulysses protocol requires reflection before continuing."
fi

exit 0
