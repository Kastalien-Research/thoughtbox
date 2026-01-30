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

# Function to check for .env file write access
is_env_file_write() {
    local tool="$1"
    local input="$2"
    
    if [[ "$tool" == "Edit" || "$tool" == "MultiEdit" || "$tool" == "Write" ]]; then
        local file_path=$(echo "$input" | jq -r '.file_path // ""')
        if [[ "$file_path" == *".env"* && "$file_path" != *".env.sample"* ]]; then
            return 0  # writing to .env
        fi
    elif [[ "$tool" == "Bash" ]]; then
        local command=$(echo "$input" | jq -r '.command // ""')
        if echo "$command" | grep -qE '\.env\b' && ! echo "$command" | grep -q '\.env\.sample'; then
            return 0  # potentially modifying .env
        fi
    fi
    return 1  # not writing to .env
}

# Check for .env file write access (read access is allowed)
if is_env_file_write "$tool_name" "$tool_input"; then
    echo "BLOCKED: Write access to .env files containing sensitive data is prohibited" >&2
    echo "Read access is allowed, but modifications must be done manually" >&2
    exit 2  # Exit code 2 blocks tool call
fi

# Function to check for .claude directory modifications
is_claude_dir_modification() {
    local tool="$1"
    local input="$2"

    if [[ "$tool" == "Edit" || "$tool" == "Write" ]]; then
        local file_path=$(echo "$input" | jq -r '.file_path // ""')
        if [[ "$file_path" == *".claude/hooks/"* || "$file_path" == *".claude/settings"* ]]; then
            return 0  # modifying .claude infrastructure
        fi
    elif [[ "$tool" == "Bash" ]]; then
        local command=$(echo "$input" | jq -r '.command // ""')
        # Block any writes to .claude/hooks or .claude/settings
        if echo "$command" | grep -qE '(>|>>|tee|mv|cp|rm).*\.claude/(hooks|settings)'; then
            return 0  # modifying .claude infrastructure
        fi
    fi
    return 1  # not modifying .claude
}

# Check for .claude directory modifications (agents should never modify their own hooks/settings)
if is_claude_dir_modification "$tool_name" "$tool_input"; then
    echo "BLOCKED: Agents cannot modify .claude/hooks or .claude/settings files" >&2
    echo "This prevents agents from disabling their own safety mechanisms" >&2
    echo "If hooks/settings need changes, the user must make them manually" >&2
    exit 2  # Exit code 2 blocks tool call
fi

# Function to check for dangerous Git operations
is_dangerous_git() {
    local command="$1"
    local normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')
    
    # Protected branches
    PROTECTED_BRANCHES=("main" "master" "develop" "production")
    
    # Check for direct push to protected branches
    for branch in "${PROTECTED_BRANCHES[@]}"; do
        if echo "$normalized" | grep -qE "git\s+push\s+.*\s+${branch}\b"; then
            return 0  # dangerous
        fi
    done
    
    # Check for force push
    if echo "$normalized" | grep -qE "git\s+push\s+.*--force" || \
       echo "$normalized" | grep -qE "git\s+push\s+.*-f\b"; then
        return 0  # dangerous
    fi
    
    # Check for branch deletion without confirmation
    if echo "$normalized" | grep -qE "git\s+branch\s+-D\s+" || \
       echo "$normalized" | grep -qE "git\s+branch\s+--delete\s+"; then
        return 0  # dangerous
    fi
    
    # Check for remote branch deletion
    if echo "$normalized" | grep -qE "git\s+push\s+.*--delete" || \
       echo "$normalized" | grep -qE "git\s+push\s+.*:refs/heads/"; then
        return 0  # dangerous
    fi
    
    return 1  # not dangerous
}

# Function to validate Git commit message format
is_invalid_commit_message() {
    local command="$1"
    local normalized=$(echo "$command" | tr -s ' ' | tr '[:upper:]' '[:lower:]')
    
    # Extract commit message from git commit -m "message"
    if echo "$normalized" | grep -qE "git\s+commit\s+.*-m\s+['\"]"; then
        # Extract message (simplified - may need refinement)
        local msg=$(echo "$command" | sed -n "s/.*-m\s*['\"]\([^'\"]*\)['\"].*/\1/p")
        if [[ -n "$msg" ]]; then
            # Check if it follows conventional commit format
            if ! echo "$msg" | grep -qE '^(feat|fix|refactor|docs|test|chore|perf|style)(\(.+\))?:'; then
                return 0  # invalid format
            fi
        fi
    fi
    
    return 1  # valid or not a commit command
}

# Check for dangerous Git operations
if [[ "$tool_name" == "Bash" ]]; then
    command=$(echo "$tool_input" | jq -r '.command // ""')
    
    # Check for dangerous rm commands
    if is_dangerous_rm "$command"; then
        echo "BLOCKED: Dangerous rm command detected and prevented" >&2
        exit 2  # Exit code 2 blocks tool call
    fi
    
    # Check for dangerous Git operations
    if is_dangerous_git "$command"; then
        echo "BLOCKED: Dangerous Git operation detected and prevented" >&2
        echo "   Protected operations:" >&2
        echo "   - Direct push to main/master/develop/production" >&2
        echo "   - Force push (--force or -f)" >&2
        echo "   - Branch deletion" >&2
        echo "   Use Pull Requests for protected branches instead." >&2
        exit 2  # Exit code 2 blocks tool call
    fi
    
    # Warn about invalid commit messages (but don't block)
    if is_invalid_commit_message "$command"; then
        echo "⚠️  WARNING: Commit message doesn't follow conventional format" >&2
        echo "   Use: type(scope): subject (e.g., feat(notebook): add feature)" >&2
        # Don't exit - just warn
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
