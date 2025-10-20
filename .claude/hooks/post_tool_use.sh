#!/usr/bin/env bash
# Post tool use hook - logs tool usage events

set -euo pipefail

# Read JSON input from stdin
input_json=$(cat)

# Ensure log directory exists
mkdir -p logs

# Read existing log data or initialize empty array
if [[ -f logs/post_tool_use.json ]]; then
    log_data=$(cat logs/post_tool_use.json)
else
    log_data="[]"
fi

# Append new data
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/post_tool_use.json

exit 0
