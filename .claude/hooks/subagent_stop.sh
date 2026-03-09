#!/usr/bin/env bash
# Subagent stop hook - logs subagent stop events

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

# Extract transcript path
transcript_path=$(echo "$input_json" | jq -r '.transcript_path // ""')

# Ensure log directory and JSON file exist
mkdir -p logs
[[ ! -s logs/subagent_stop.json ]] && echo "[]" > logs/subagent_stop.json

# Append new data
log_data=$(cat logs/subagent_stop.json)
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/subagent_stop.json

# Handle --chat switch: convert .jsonl transcript to JSON array
if [[ "$chat" == "true" && -n "$transcript_path" && -f "$transcript_path" ]]; then
    jq -s '.' "$transcript_path" > logs/chat.json 2>/dev/null || true
fi

# Note: TTS completion announcement removed
# Subagent completions are now logged only

exit 0
