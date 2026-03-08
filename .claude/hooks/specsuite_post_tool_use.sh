#!/usr/bin/env bash
# SpecSuite PostToolUse hook: append audit entries for spec edits.

set -euo pipefail

input_json="$(cat)"

tool_name="$(echo "$input_json" | jq -r '.tool_name // ""')"

# Only care about file mutation tools.
case "$tool_name" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
suite_dir="$project_dir/.specification-suite"
state_path="$suite_dir/state.json"
amendments_path="$suite_dir/amendments.json"

mkdir -p "$suite_dir"

phase=""
output_folder=""
if [[ -f "$state_path" ]]; then
  phase="$(jq -r '.current_phase // .phase // ""' "$state_path" 2>/dev/null || true)"
  output_folder="$(jq -r '.output_folder // .outputFolder // ""' "$state_path" 2>/dev/null || true)"
fi

extract_paths_json() {
  if [[ "$tool_name" == "Write" || "$tool_name" == "Edit" ]]; then
    echo "$input_json" | jq -c '[.tool_input.file_path // empty] | map(select(. != ""))'
    return
  fi

  # MultiEdit: best-effort across schema variants.
  echo "$input_json" | jq -c '
    (
      (.tool_input.edits // []) | map(.file_path // empty)
    ) + (
      (.tool_input.files // []) | map(.file_path // empty)
    )
    | map(select(. != ""))
    | unique
  '
}

paths_json="$(extract_paths_json)"
if [[ "$(echo "$paths_json" | jq 'length')" -eq 0 ]]; then
  exit 0
fi

is_spec_related=false
if echo "$paths_json" | jq -r '.[]' | while IFS= read -r p; do
  [[ -z "$p" ]] && continue

  rel="$p"
  if [[ "$p" == "$project_dir/"* ]]; then
    rel="${p#"$project_dir"/}"
  fi

  if [[ "$rel" == ".specification-suite/"* ]]; then
    echo "yes"
    exit 0
  fi

  if [[ "$rel" == ".specs/"* ]]; then
    echo "yes"
    exit 0
  fi

  if [[ -n "$output_folder" ]]; then
    of="$output_folder"
    if [[ "$output_folder" == "$project_dir/"* ]]; then
      of="${output_folder#"$project_dir"/}"
    fi
    of="${of%/}/"
    if [[ "$rel" == "$of"* ]]; then
      echo "yes"
      exit 0
    fi
  fi
done | grep -q '^yes$'; then
  is_spec_related=true
fi

if [[ "$is_spec_related" != "true" ]]; then
  exit 0
fi

# Ensure amendments file exists as JSON array (never empty).
[[ ! -s "$amendments_path" ]] && echo "[]" > "$amendments_path"

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
session_id="$(echo "$input_json" | jq -r '.session_id // ""')"

entry="$(jq -n \
  --arg timestamp "$timestamp" \
  --arg session_id "$session_id" \
  --arg tool "$tool_name" \
  --arg phase "$phase" \
  --arg output_folder "$output_folder" \
  --argjson file_paths "$paths_json" \
  '{
    timestamp: $timestamp,
    session_id: ($session_id | select(. != "")),
    tool: $tool,
    phase: ($phase | select(. != "")),
    output_folder: ($output_folder | select(. != "")),
    file_paths: $file_paths
  }'
)"

tmp="${amendments_path}.tmp.$$"
jq --argjson entry "$entry" '. + [$entry]' "$amendments_path" > "$tmp" && mv "$tmp" "$amendments_path"

exit 0

