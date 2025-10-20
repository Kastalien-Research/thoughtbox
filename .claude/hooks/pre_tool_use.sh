#!/usr/bin/env bash
# Pre-tool use hook - validates and logs tool usage

set -euo pipefail

# Read JSON input from stdin
input_json=$(cat)

# Extract tool name and input
tool_name=$(echo "$input_json" | jq -r '.tool_name // ""')
tool_input=$(echo "$input_json" | jq -r '.tool_input // {}')

# Function to check for dangerous rm commands
is_dangerous_rm() {
    local command="$1"
    local normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')
    
    # Check for rm -rf patterns
    if echo "$normalized" | grep -qE '\brm\s+.*-[a-z]*r[a-z]*f' || \
       echo "$normalized" | grep -qE '\brm\s+.*-[a-z]*f[a-z]*r' || \
       echo "$normalized" | grep -qE '\brm\s+--recursive\s+--force' || \
       echo "$normalized" | grep -qE '\brm\s+--force\s+--recursive'; then
        
        # Check for dangerous paths
        if echo "$normalized" | grep -qE '(/\*|~|~\/|\$HOME|\.\.|^\s*\.)'; then
            return 0  # dangerous
        fi
        return 0  # any rm -rf is dangerous
    fi
    return 1  # not dangerous
}

# Function to check for .env file access
is_env_file_access() {
    local tool="$1"
    local input="$2"
    
    if [[ "$tool" == "Read" || "$tool" == "Edit" || "$tool" == "MultiEdit" || "$tool" == "Write" ]]; then
        local file_path=$(echo "$input" | jq -r '.file_path // ""')
        if [[ "$file_path" == *".env"* && "$file_path" != *".env.sample"* ]]; then
            return 0  # accessing .env
        fi
    elif [[ "$tool" == "Bash" ]]; then
        local command=$(echo "$input" | jq -r '.command // ""')
        if echo "$command" | grep -qE '\.env\b' && ! echo "$command" | grep -q '\.env\.sample'; then
            return 0  # accessing .env
        fi
    fi
    return 1  # not accessing .env
}

# Check for .env file access
if is_env_file_access "$tool_name" "$tool_input"; then
    echo "BLOCKED: Access to .env files containing sensitive data is prohibited" >&2
    echo "Use .env.sample for template files instead" >&2
    exit 2  # Exit code 2 blocks tool call
fi

# Check for dangerous rm commands
if [[ "$tool_name" == "Bash" ]]; then
    command=$(echo "$tool_input" | jq -r '.command // ""')
    if is_dangerous_rm "$command"; then
        echo "BLOCKED: Dangerous rm command detected and prevented" >&2
        exit 2  # Exit code 2 blocks tool call
    fi
fi

# Ensure log directory exists
mkdir -p logs

# Read existing log data or initialize empty array
if [[ -f logs/pre_tool_use.json ]]; then
    log_data=$(cat logs/pre_tool_use.json)
else
    log_data="[]"
fi

# Append new data
echo "$log_data" | jq --argjson new "$input_json" '. += [$new]' > logs/pre_tool_use.json

exit 0
