#!/usr/bin/env bash
# Git command validator for Claude Code hooks
# Validates Git commands and returns JSON decision

set -euo pipefail

# Read JSON input from stdin
input_json=$(cat)

# Extract command
command=$(echo "$input_json" | jq -r '.command // ""')
normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')

# Protected branches
PROTECTED_BRANCHES=("main" "master" "develop" "production")

# Check for direct push to protected branches
for branch in "${PROTECTED_BRANCHES[@]}"; do
    if echo "$normalized" | grep -qE "git\s+push\s+.*\s+${branch}\b"; then
        echo "{\"decision\":\"block\",\"reason\":\"Direct push to protected branch '$branch' is blocked. Use a Pull Request instead.\"}"
        exit 0
    fi
done

# Check for force push
if echo "$normalized" | grep -qE "git\s+push\s+.*--force" || \
   echo "$normalized" | grep -qE "git\s+push\s+.*-f\b"; then
    echo "{\"decision\":\"block\",\"reason\":\"Force push detected. Force pushing to shared branches is prohibited.\"}"
    exit 0
fi

# Check for branch deletion (prompt instead of block)
if echo "$normalized" | grep -qE "git\s+branch\s+-D\s+" || \
   echo "$normalized" | grep -qE "git\s+branch\s+--delete\s+" || \
   echo "$normalized" | grep -qE "git\s+push\s+.*--delete" || \
   echo "$normalized" | grep -qE "git\s+push\s+.*:refs/heads/"; then
    echo "{\"decision\":\"prompt\",\"reason\":\"Branch deletion detected. This action cannot be undone. Continue?\"}"
    exit 0
fi

# Check for invalid commit message format
if echo "$normalized" | grep -qE "git\s+commit\s+.*-m\s+['\"]"; then
    msg=$(echo "$command" | sed -n "s/.*-m\s*['\"]\([^'\"]*\)['\"].*/\1/p")
    if [[ -n "$msg" ]]; then
        if ! echo "$msg" | grep -qE '^(feat|fix|refactor|docs|test|chore|perf|style)(\(.+\))?:'; then
            echo "{\"decision\":\"prompt\",\"reason\":\"Commit message doesn't follow conventional format. Use: type(scope): subject (e.g., feat(notebook): add feature)\"}"
            exit 0
        fi
    fi
fi

# Allow by default
echo "{\"decision\":\"approve\"}"
exit 0
