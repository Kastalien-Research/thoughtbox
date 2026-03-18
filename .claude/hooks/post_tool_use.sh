#!/usr/bin/env bash
# Post-tool use hook - log Git operations for audit

set -euo pipefail

# Read JSON input from stdin
input_json=$(cat)

# Extract tool name and input safely (prevent pipefail crash)
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""' 2>/dev/null || echo "")
tool_input=$(echo "$input_json" | jq -c '.tool_input // {}' 2>/dev/null || echo "{}")

# Only log Git-related Bash commands
if [[ "$tool_name" == "Bash" || "$tool_name" == "Shell" ]]; then
    command=$(echo "$tool_input" | jq -r '
      if type == "object" then
        (.command // "")
      elif type == "string" then
        .
      else
        ""
      end
    ' 2>/dev/null || echo "")
    
    # Check if this is a Git command
    if echo "$command" | grep -qiE "^\s*git\s+"; then
        # Ensure log directory and JSON file exist
        mkdir -p logs
        [[ ! -s logs/git_operations.json ]] && echo "[]" > logs/git_operations.json

        # Create audit log entry and append
        timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        log_entry=$(jq -n \
            --arg tool "$tool_name" \
            --arg command "$command" \
            --arg timestamp "$timestamp" \
            '{
                "tool": $tool,
                "command": $command,
                "timestamp": $timestamp
            }')
        existing=$(cat logs/git_operations.json)
        echo "$existing" | jq --argjson entry "$log_entry" '. + [$entry]' > logs/git_operations.json
    fi
fi

exit 0
