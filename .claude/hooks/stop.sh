#!/usr/bin/env bash
# Stop hook - logs session stop and optionally converts transcript

set -euo pipefail

# Parse command line arguments
chat=false
notify=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --chat)
            chat=true
            shift
            ;;
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
if [[ -f logs/stop.json ]]; then
    log_data=$(cat logs/stop.json)
else
    log_data="[]"
fi

# Append new data
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/stop.json

# Handle --chat switch: convert .jsonl transcript to JSON array
if [[ "$chat" == "true" ]]; then
    transcript_path=$(echo "$input_json" | jq -r '.transcript_path // ""')
    if [[ -n "$transcript_path" && -f "$transcript_path" ]]; then
        # Convert JSONL to JSON array
        jq -s '.' "$transcript_path" > logs/chat.json 2>/dev/null || true
    fi
fi

# Note: TTS completion announcement removed
# Completion messages are now static:
# "Work complete!", "All done!", "Task finished!", "Ready for next task!"

exit 0
