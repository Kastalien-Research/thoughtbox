#!/usr/bin/env bash
# TaskCompleted: Fast test gate for agent team task completions.
# Blocks task completion if tests haven't passed since last code change.
# Runs before the Verification Judge agent hook (stacked).
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
state_dir="$project_dir/.claude/state"

# Consume stdin
cat > /dev/null

# If tests-passed-since-edit sentinel is missing, block
if [[ -f "$state_dir/tests-passed-since-edit" ]]; then
  exit 0
fi

# No sentinel — but if the state dir doesn't exist, don't block
[[ -d "$state_dir" ]] || exit 0

echo "Tests have not passed since last code change. Run tests before completing this task." >&2
exit 2
