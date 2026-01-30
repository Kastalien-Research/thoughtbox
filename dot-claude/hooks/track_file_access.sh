#!/usr/bin/env bash
###
# File Access Tracker Hook
# Called from post_tool_use to track which files agents access
# Used by pattern detector to identify coverage gaps
###

set -euo pipefail

# Read JSON input
input_json=$(cat)

# Extract tool info
tool_name=$(echo "$input_json" | jq -r '.tool_name // "unknown"')
tool_args=$(echo "$input_json" | jq -r '.tool_arguments // "{}"')

# State directory
STATE_DIR=".claude/state"
mkdir -p "$STATE_DIR"

ACCESS_LOG="$STATE_DIR/file_access.log"
ERROR_LOG="$STATE_DIR/errors.log"

# Track file reads/writes
case "$tool_name" in
    "read_file"|"write"|"search_replace"|"edit_notebook")
        # Extract file path from arguments
        file_path=$(echo "$tool_args" | jq -r '.target_file // .file_path // .target_notebook // ""')
        
        if [[ -n "$file_path" && "$file_path" != "null" ]]; then
            timestamp=$(date '+%Y-%m-%d %H:%M:%S')
            echo "[$timestamp] $file_path" >> "$ACCESS_LOG"
            
            # Keep log manageable (last 500 entries)
            if [[ $(wc -l < "$ACCESS_LOG") -gt 500 ]]; then
                tail -500 "$ACCESS_LOG" > "$ACCESS_LOG.tmp"
                mv "$ACCESS_LOG.tmp" "$ACCESS_LOG"
            fi
        fi
        ;;
esac

# Track errors (for repeated issue detection)
tool_result=$(echo "$input_json" | jq -r '.result.isError // false')
if [[ "$tool_result" == "true" ]]; then
    error_msg=$(echo "$input_json" | jq -r '.result.content // "Unknown error"')
    
    # Normalize error message (remove specifics like line numbers, IDs)
    normalized_error=$(echo "$error_msg" | sed -E 's/[0-9]+/N/g; s/"[^"]*"/"STR"/g' | head -c 200)
    
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $normalized_error" >> "$ERROR_LOG"
    
    # Keep log manageable
    if [[ $(wc -l < "$ERROR_LOG") -gt 200 ]]; then
        tail -200 "$ERROR_LOG" > "$ERROR_LOG.tmp"
        mv "$ERROR_LOG.tmp" "$ERROR_LOG"
    fi
fi

# Silent exit (no output to agent)
exit 0
