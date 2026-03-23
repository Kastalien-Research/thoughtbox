#!/usr/bin/env bash
# TaskCompleted: Fast test gate for agent team task completions.
# Blocks task completion if tests haven't passed since last code change.
# Runs before the Verification Judge agent hook (stacked).
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
state_dir="$project_dir/.claude/state/bead-workflow"

# Consume stdin
cat > /dev/null

# If no bead workflow state dir, no enforcement
[[ -d "$state_dir" ]] || exit 0

# If tests-passed-since-edit sentinel is missing, block
if [[ ! -f "$state_dir/tests-passed-since-edit" ]]; then
  echo "Tests have not passed since last code change. Run tests before completing this task." >&2
  exit 2
fi

exit 0
