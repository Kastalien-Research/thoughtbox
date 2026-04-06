#!/usr/bin/env bash
# Notification hook - logs notification events

set -uo pipefail

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

# Ensure log directory and JSON file exist
mkdir -p logs
[[ ! -s logs/notification.json ]] && echo "[]" > logs/notification.json

# Append new data
log_data=$(cat logs/notification.json)
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/notification.json

# Note: TTS notification announcement removed
# Notifications are now logged only

exit 0
