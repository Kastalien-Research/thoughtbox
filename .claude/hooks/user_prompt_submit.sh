#!/usr/bin/env bash
# User prompt submit hook - logs and validates user prompts

set -euo pipefail

# Parse command line arguments
validate=false
log_only=false
store_last_prompt=false
name_agent=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --validate)
            validate=true
            shift
            ;;
        --log-only)
            log_only=true
            shift
            ;;
        --store-last-prompt)
            store_last_prompt=true
            shift
            ;;
        --name-agent)
            name_agent=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Read JSON input from stdin
input_json=$(cat)

# Extract fields
session_id=$(echo "$input_json" | jq -r '.session_id // "unknown"')
prompt=$(echo "$input_json" | jq -r '.prompt // ""')

# Ensure log directory and JSON file exist
mkdir -p logs
[[ ! -s logs/user_prompt_submit.json ]] && echo "[]" > logs/user_prompt_submit.json

# Append new data
log_data=$(cat logs/user_prompt_submit.json)
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/user_prompt_submit.json

# Manage session data if requested
if [[ "$store_last_prompt" == "true" || "$name_agent" == "true" ]]; then
    mkdir -p .claude/data/sessions
    session_file=".claude/data/sessions/${session_id}.json"
    
    # Load or create session data (empty file => treat as new session)
    default_session=$(jq -n --arg sid "$session_id" '{session_id: $sid, prompts: []}')
    if [[ -s "$session_file" ]]; then
        session_data=$(cat "$session_file")
        if ! echo "$session_data" | jq -e 'type == "object"' >/dev/null 2>&1; then
            session_data="$default_session"
        fi
    else
        session_data="$default_session"
    fi

    # Add the new prompt
    session_data=$(echo "$session_data" | jq --arg p "$prompt" '.prompts += [$p]')
    
    # Generate agent name if requested and not already present (simplified - no LLM)
    if [[ "$name_agent" == "true" ]]; then
        has_name=$(echo "$session_data" | jq -r '.agent_name // ""')
        if [[ -z "$has_name" ]]; then
            # Use simple random name from predefined list
            names=("Phoenix" "Sage" "Nova" "Echo" "Atlas" "Cipher" "Nexus" "Oracle" "Quantum" "Zenith")
            random_name=${names[$RANDOM % ${#names[@]}]}
            session_data=$(echo "$session_data" | jq --arg name "$random_name" '.agent_name = $name')
        fi
    fi
    
    # Save session data
    echo "$session_data" > "$session_file"
fi

# Validate prompt if requested and not in log-only mode
if [[ "$validate" == "true" && "$log_only" == "false" ]]; then
    # Example validation: block dangerous patterns
    # Add your own validation rules here
    if echo "$prompt" | grep -qi "rm -rf /"; then
        echo "Prompt blocked: Dangerous command pattern detected" >&2
        exit 2  # Exit code 2 blocks the prompt
    fi
fi

exit 0
