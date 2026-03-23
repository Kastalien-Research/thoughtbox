#!/usr/bin/env bash
# PreToolUse: BLOCK when Delphi SYNTHESIZE is required (N=2).
# Forces the agent to call thoughtbox_delphi complete (and optionally
# witness) instead of continuing to do unstructured research.
set -euo pipefail

delphi_state_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/state/delphi"

# If no synthesize-required sentinel, pass through
[[ -f "$delphi_state_dir/synthesize-required" ]] || exit 0

input_json=$(cat)
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty' 2>/dev/null)
command=$(echo "$input_json" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Allow: reading files (needed to write the synthesis)
if [[ "$tool_name" == "Read" || "$tool_name" == "Glob" \
   || "$tool_name" == "Grep" || "$tool_name" == "AskUserQuestion" ]]; then
  exit 0
fi

# Allow: Delphi tool calls (complete, witness, status)
if [[ "$tool_name" == *"delphi"* ]]; then
  exit 0
fi

# Allow: Skill tool (might be invoking delphi-protocol skill)
if [[ "$tool_name" == "Skill" ]]; then
  exit 0
fi

# Allow: bd commands, git status/diff (workflow management)
if [[ "$tool_name" == "Bash" ]]; then
  if [[ "$command" == *"bd "* \
     || "$command" == *"git status"* \
     || "$command" == *"git diff"* \
     || "$command" == *"git log"* ]]; then
    exit 0
  fi
fi

# Allow: Agent tool (for Iron Witness sub-agent)
if [[ "$tool_name" == "Agent" ]]; then
  exit 0
fi

echo "BLOCKED: SYNTHESIZE REQUIRED (Delphi N=2)." >&2
echo "Two consecutive non-discriminating probes. Further research will not help." >&2
echo "You MUST either:" >&2
echo "  1. Invoke Iron Witness: thoughtbox_delphi { operation: \"witness\", ... }" >&2
echo "  2. Complete the session: thoughtbox_delphi { operation: \"complete\", ... }" >&2
echo "Terminal states: supported_thesis, refined_question, capability_gap, irreducible_uncertainty" >&2
exit 1
