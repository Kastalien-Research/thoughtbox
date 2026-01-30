#!/usr/bin/env bash
# Pre-compact hook - logs compaction events and optionally backs up transcripts

set -euo pipefail

# Parse command line arguments
backup=false
verbose=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup)
            backup=true
            shift
            ;;
        --verbose)
            verbose=true
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
if [[ -f logs/pre_compact.json ]]; then
    log_data=$(cat logs/pre_compact.json)
else
    log_data="[]"
fi

# Append new data
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/pre_compact.json

# Extract fields for backup
session_id=$(echo "$input_json" | jq -r '.session_id // "unknown"')
transcript_path=$(echo "$input_json" | jq -r '.transcript_path // ""')
trigger=$(echo "$input_json" | jq -r '.trigger // "unknown"')

# Create backup if requested
if [[ "$backup" == "true" && -n "$transcript_path" && -f "$transcript_path" ]]; then
    mkdir -p logs/transcript_backups
    timestamp=$(date +%Y%m%d_%H%M%S)
    session_name=$(basename "$transcript_path" .jsonl)
    backup_name="${session_name}_pre_compact_${trigger}_${timestamp}.jsonl"
    cp "$transcript_path" "logs/transcript_backups/$backup_name"
    
    if [[ "$verbose" == "true" ]]; then
        if [[ "$trigger" == "manual" ]]; then
            echo "Preparing for manual compaction (session: ${session_id:0:8}...)"
        else
            echo "Auto-compaction triggered due to full context window (session: ${session_id:0:8}...)"
        fi
        echo "Transcript backed up to: logs/transcript_backups/$backup_name"
    fi
fi

exit 0
