#!/usr/bin/env bash
# SpecSuite Stop hook: block stopping when suite state incomplete.

set -uo pipefail

hook_input="$(cat)"

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
state_path="$project_dir/.specification-suite/state.json"

if [[ ! -f "$state_path" ]]; then
  exit 0
fi

# If Claude Code is already continuing due to a Stop hook, do nothing.
if echo "$hook_input" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
  exit 0
fi

halted="$(jq -r '.halted // .cancelled // .aborted // false' "$state_path" 2>/dev/null || echo "false")"
if [[ "$halted" == "true" ]]; then
  exit 0
fi

overall="$(jq -r '.status // ""' "$state_path" 2>/dev/null || true)"
case "$overall" in
  completed|complete|done|success|passed) exit 0 ;;
esac

phases_exist="$(jq -r 'has("phases")' "$state_path" 2>/dev/null || echo "false")"
if [[ "$phases_exist" == "true" ]]; then
  # Gather phase statuses and find any that are not terminal.
  non_terminal="$(
    jq -r '
      .phases
      | to_entries[]
      | "\(.key)\t\(.value.status // .value.state // "")"
    ' "$state_path" 2>/dev/null \
    | awk -F'\t' '
        function is_terminal(s) {
          return (s == "completed" || s == "complete" || s == "done" || s == "success" || s == "passed" || s == "skipped");
        }
        {
          phase=$1; status=$2;
          if (status == "") { print phase "=<missing>"; next }
          if (!is_terminal(status)) { print phase "=" status }
        }
      '
  )"

  if [[ -z "$non_terminal" ]]; then
    exit 0
  fi

  {
    echo "BLOCKED: specification-suite is not complete."
    echo ""
    echo "Non-terminal phases:"
    echo "$non_terminal" | sed 's/^/  - /'
    echo ""
    echo "Next action:"
    echo "  - Resume the suite and finish remaining phases, or explicitly mark the run halted in .specification-suite/state.json."
  } >&2
  exit 2
fi

# Fallback: state exists but schema is unknown and not marked complete/halted.
{
  echo "BLOCKED: specification-suite has an active state file and is not marked complete."
  echo ""
  echo "State file:"
  echo "  - $state_path"
  echo ""
  echo "Next action:"
  echo "  - Complete the suite run, or set status=completed (or halted=true) in the state file."
} >&2

exit 2

