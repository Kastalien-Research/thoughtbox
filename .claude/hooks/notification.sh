#!/usr/bin/env bash
# Notification hook - logs notification events

set -euo pipefail

# Parse command line arguments
notify=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --notify)
            notify=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Read JSON input from stdin
input_json=$(cat)

# Ensure log directory exists
mkdir -p logs

# Read existing log data or initialize empty array
if [[ -f logs/notification.json ]]; then
    log_data=$(cat logs/notification.json)
else
    log_data="[]"
fi

# Append new data
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/notification.json

# Note: TTS functionality removed - notifications now logged only
# If you need notifications, consider using native macOS notifications:
# message=$(echo "$input_json" | jq -r '.message // "Claude is waiting for input"')
# osascript -e "display notification \"$message\" with title \"Claude Code\""

exit 0
