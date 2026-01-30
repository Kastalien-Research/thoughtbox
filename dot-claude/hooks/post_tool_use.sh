#!/usr/bin/env bash
# Post-tool use hook - log Git operations for audit

set -euo pipefail

# Read JSON input from stdin
input_json=$(cat)

# Extract tool name and input
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
tool_input=$(echo "$input_json" | jq -r '.tool_input // {}')

# Only log Git-related Bash commands
if [[ "$tool_name" == "Bash" ]]; then
    command=$(echo "$tool_input" | jq -r '.command // ""')
    
    # Check if this is a Git command
    if echo "$command" | grep -qiE "^\s*git\s+"; then
        # Ensure log directory exists
        mkdir -p logs
        
        # Create audit log entry
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
        
        # Append to Git operations log
        if [[ -f logs/git_operations.json ]]; then
            existing=$(cat logs/git_operations.json)
            echo "$existing" | jq --argjson entry "$log_entry" '. += [$entry]' > logs/git_operations.json
        else
            echo "[$log_entry]" > logs/git_operations.json
        fi
    fi
fi

exit 0
